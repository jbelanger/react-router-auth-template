import RedisStore from 'connect-redis';
import { MemoryStore } from 'express-session';
import { setInterval } from 'node:timers';
import type { RedisClientType } from 'redis';

import { getLogger } from '@gc-fwcs/logger';

/**
 * Configuration options for Redis session store.
 */
interface RedisStoreOptions {
    /** Redis client instance to use for session storage */
    cacheClient: RedisClientType;
    /** Time in seconds after which sessions expire */
    sessionTtlSeconds: number;
    /** Optional prefix for Redis keys to namespace session data */
    sessionKeyPrefix?: string;
}

// Cleanup expired sessions from memory store every minute
const MEMORY_STORE_CLEANUP_INTERVAL_MS = 60_000;

// Add 5% to session TTL to handle clock drift between distributed servers
const REDIS_TTL_DRIFT_FACTOR = 1.05;

/**
 * Creates an in-memory store for Express sessions.
 * 
 * Warning: This store should only be used for development/testing.
 * For production environments, use Redis or another distributed store.
 * 
 * Features:
 * - Automatic cleanup of expired sessions every minute
 * - In-memory storage (data is lost on server restart)
 * - No need for external dependencies
 * 
 * @returns A configured MemoryStore instance
 */
export function createMemoryStore(): MemoryStore {
    const log = getLogger('session/createMemoryStore');
    log.info('Initializing new memory session store');
    const memoryStore = new MemoryStore();

    log.info('Registering automated session cleanup (interval: %d ms)', MEMORY_STORE_CLEANUP_INTERVAL_MS);
    setInterval(
        () => cleanupExpiredSessions(memoryStore),
        MEMORY_STORE_CLEANUP_INTERVAL_MS
    );

    return memoryStore;
}

/**
 * Creates a Redis-backed store for Express sessions.
 * 
 * Features:
 * - Distributed session storage suitable for production
 * - Automatic session expiration handled by Redis
 * - Built-in handling of clock drift between servers
 * - Optional key prefixing for multi-tenant scenarios
 * 
 * @param options Configuration options for the Redis store
 * @returns A configured RedisStore instance
 * 
 * @example
 * ```typescript
 * const store = createRedisStore({
 *   cacheClient: redisClient,
 *   sessionTtlSeconds: 3600, // 1 hour
 *   sessionKeyPrefix: 'myapp:session:'
 * });
 * ```
 */
export function createRedisStore(options: RedisStoreOptions): RedisStore {
    const log = getLogger('session/createRedisStore');
    log.info('Initializing new Redis session store');

    // Add buffer time to handle clock differences between distributed servers
    const sessionTtlWithDrift = options.sessionTtlSeconds * REDIS_TTL_DRIFT_FACTOR;

    return new RedisStore({
        client: options.cacheClient,
        prefix: options.sessionKeyPrefix,
        ttl: sessionTtlWithDrift,
    });
}

/**
 * Removes expired sessions from the provided memory store.
 * 
 * This cleanup function:
 * 1. Retrieves all sessions from the store
 * 2. Checks each session's expiration time
 * 3. Removes sessions that have expired
 * 
 * Note: This is only needed for MemoryStore since Redis handles
 * expiration automatically using its built-in TTL mechanism.
 * 
 * @param memoryStore The MemoryStore instance to clean up
 */
function cleanupExpiredSessions(memoryStore: MemoryStore): void {
    const log = getLogger('session/cleanupExpiredSessions');
    log.trace('Starting expired session cleanup');

    const isExpired = (date: Date): boolean => date.getTime() < Date.now();

    memoryStore.all((error, sessions) => {
        if (sessions) {
            const sessionEntries = Object.entries(sessions);
            log.trace('Processing %d sessions for expiration', sessionEntries.length);

            sessionEntries.forEach(([sessionId, sessionData]) => {
                const sessionExpiry = sessionData.cookie.expires;

                log.trace('Evaluating session %s (expires: %s)', sessionId, sessionExpiry);
                if (sessionExpiry && isExpired(new Date(sessionExpiry))) {
                    log.trace('Removing expired session %s', sessionId);
                    memoryStore.destroy(sessionId);
                }
            });
        }
    });
}
