/**
 * @module session
 * 
 * A comprehensive session management module for Express applications.
 * 
 * Features:
 * - Type-safe session operations
 * - Multiple storage backends (Memory, Redis)
 * - CSRF protection
 * - Automatic key normalization
 * - Detailed logging
 * 
 * Storage Options:
 * - Memory Store: For development and testing
 * - Redis Store: For production deployments
 * 
 * Example Usage:
 * ```typescript
 * import { createRedisCacheClient, createRedisStore, createSession } from '@gc-fwcs/session';
 * 
 * // Setup Redis client
 * const redis = await createRedisCacheClient({
 *   host: 'localhost',
 *   port: 6379
 * });
 * 
 * // Configure session store
 * const store = createRedisStore({
 *   cacheClient: redis,
 *   sessionTtlSeconds: 3600
 * });
 * 
 * // Create session manager
 * const session = createSession(req.session);
 * 
 * // Use session
 * session.set('user', { id: 1 });
 * const user = session.get('user');
 * ```
 */

/** Export session store implementations */
export { createRedisStore, createMemoryStore } from './session-store.ts';

/** Export core session management functionality */
export { createSession, createNullSession, type Session } from './session-manager.ts';

/** Export Redis client factory */
export { createRedisCacheClient } from './redis-client.ts';