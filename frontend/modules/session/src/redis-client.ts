import { getLogger } from '@gc-fwcs/logger';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

/**
 * Configuration options for Redis client setup.
 * Includes connection, memory management, and timeout settings.
 */
interface RedisClientConfig {
   /** Redis server hostname */
   host?: string;
   /** Redis server port */
   port?: number;
   /** Redis authentication password */
   password?: string;
   /** Maximum memory limit (e.g., "4000mb") */
   maxMemoryMb?: string;
   /** Memory eviction policy when max memory is reached.
    * - volatile-lru: Remove least recently used keys with expiry
    * - allkeys-lru: Remove least recently used keys regardless of expiry
    * - volatile-random: Remove random keys with expiry
    * - allkeys-random: Remove random keys regardless of expiry
    * - volatile-ttl: Remove keys closest to expiry
    */
   memoryEvictionPolicy?: 'volatile-lru' | 'allkeys-lru' | 'volatile-random' | 'allkeys-random' | 'volatile-ttl';
   /** Timeout in seconds for Redis operations */
   operationTimeoutSeconds?: number;
}

/**
 * Extracts a human-readable error message from Redis errors.
 * Handles both regular errors and aggregate errors (multiple errors combined).
 *
 * @param error The error object to process
 * @returns A string containing the most relevant error message
 */
function extractRedisErrorMessage(error: unknown): string {
   if (error instanceof AggregateError && error.errors?.length > 0) {
      return error.errors[0]?.message || 'Unknown aggregate error';
   }
   return (error as Error)?.message || (error as { code?: string })?.code || 'Unknown error';
}

/**
 * Default Redis configuration values.
 * These settings are used when specific values aren't provided in the config.
 */
const DEFAULT_REDIS_CONFIG = {
   /** Default maximum memory allocation - suitable for most use cases */
   maxMemoryMb: '4000mb',
   /** Default eviction policy - removes least recently used keys that have an expiry set */
   memoryEvictionPolicy: 'volatile-lru',
} as const;

/**
 * Creates and configures a Redis client for session storage.
 *
 * Features:
 * - Automatic connection management and retry logic
 * - Exponential backoff for connection retries
 * - Configurable memory limits and eviction policies
 * - Error handling and logging
 *
 * @param config Client configuration options
 * @throws {Error} If required host or port is missing
 * @returns Configured Redis client instance
 *
 * @example
 * ```typescript
 * const client = await createRedisCacheClient({
 *   host: 'localhost',
 *   port: 6379,
 *   maxMemoryMb: '2000mb',
 *   memoryEvictionPolicy: 'volatile-lru'
 * });
 * ```
 */
export async function createRedisCacheClient(config: RedisClientConfig): Promise<RedisClientType> {
   const log = getLogger('session/createRedisCacheClient');

   if (!config.host || !config.port) {
      throw new Error('Redis host and port are required');
   }

   /**
    * Calculates the delay before the next connection retry attempt.
    * Uses exponential backoff starting at 250ms with a maximum of 5 seconds.
    *
    * @param retryAttempt The current retry attempt number
    * @returns Delay in milliseconds, or false to stop retrying
    */
   const calculateRetryDelay = (retryAttempt: number): number | false => {
      const retryDelayMs = Math.min(250 * Math.pow(2, retryAttempt - 1), 5000);
      log.error('Redis connection failed (attempt #%s); retrying in %s ms', retryAttempt, retryDelayMs);
      return retryDelayMs;
   };

   // Initialize Redis client with connection settings
   const redisClient = createClient({
      socket: {
         host: config.host,
         port: config.port,
         connectTimeout: (config.operationTimeoutSeconds ?? 1) * 1000,
         reconnectStrategy(retries, cause) {
            return calculateRetryDelay(retries);
         },
      },
      password: config.password,
   });

   // Set up event handlers for connection lifecycle
   redisClient.on('connect', () => log.info('Redis connected to %s:%s', config.host, config.port));
   redisClient.on('end', () => log.info('Redis connection closed'));
   redisClient.on('error', (error) => log.error('Redis client error: %s', extractRedisErrorMessage(error)));

   // Establish initial connection
   await redisClient.connect();

   // Configure Redis memory management settings
   // These settings control how Redis handles memory pressure and key eviction
   // See: https://learn.microsoft.com/azure/azure-cache-for-redis/cache-best-practices-memory-management
   await redisClient.configSet('maxmemory', config.maxMemoryMb ?? DEFAULT_REDIS_CONFIG.maxMemoryMb);
   await redisClient.configSet(
      'maxmemory-policy',
      config.memoryEvictionPolicy ?? DEFAULT_REDIS_CONFIG.memoryEvictionPolicy,
   );

   return redisClient as RedisClientType;
}
