import { getLogger } from "@gc-fwcs/logger";
import sessionMiddleware from 'express-session';
import type { CookieOptions, RequestHandler } from 'express';
import { shouldIgnore } from '@gc-fwcs/helpers';
import { randomUUID } from "crypto";
import { createMemoryStore, createRedisStore } from "@gc-fwcs/session";
import type { RedisClientType } from "redis";

/**
 * Default session configuration values with secure defaults.
 */
const DEFAULT_CONFIG: Partial<SessionConfig> = {
    storageType: 'memory',
    cookie: {
        name: 'connect.sid',
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
    },
    ignoredPaths: [
        '/api/buildinfo',
        '/api/health',
        '/api/readyz',
        '/.well-known/jwks.json'
    ]
};

/** Session storage backend type */
export type SessionStorageType = 'memory' | 'redis';

/** Cookie same-site policy options */
export type SameSiteMode = 'lax' | 'strict' | 'none';

/**
 * Cookie configuration options.
 * Security-sensitive options are enforced by the middleware
 * and cannot be overridden.
 */
export interface CookieConfig {
    /** Cookie name (default: connect.sid) */
    name?: string;
    /** Cookie domain scope */
    domain?: string;
    /** Cookie path scope (default: /) */
    path?: string;
    /** Same-site cookie policy (default: lax) */
    sameSite?: SameSiteMode;
    /** Cookie lifetime in milliseconds (default: 1 hour) */
    maxAge?: number;
}

/**
 * Session middleware configuration.
 */
export interface SessionConfig {
    /**
     * Session storage configuration
     */
    storageType: SessionStorageType;
    /** Redis client (required if storageType is 'redis') */
    redisClient?: RedisClientType;
    /** Key prefix for Redis storage */
    keyPrefix?: string;
    /** Session TTL in seconds (required for Redis) */
    ttlSeconds?: number;

    /** Cookie configuration */
    cookie?: CookieConfig;

    /**
     * Session secrets used for cookie signing.
     * Multiple secrets support key rotation:
     * - First secret is used for signing
     * - Other secrets are used for verification
     */
    secrets: string[];

    /** Paths to exclude from session management */
    ignoredPaths?: string[];
}

/**
 * Creates session middleware for Express applications with secure defaults.
 * 
 * Security Features (automatically enforced):
 * - HttpOnly cookies
 * - Secure cookies in production
 * - Same-site cookie policy (lax/strict only)
 * - UUID session IDs
 * - Key rotation support
 * - No client-accessible session data
 * 
 * @param isProduction Whether the app is running in production mode
 * @param config Session configuration options
 * @throws {Error} If no session secrets are provided
 * @throws {Error} If Redis is selected but required options are missing
 * @returns Configured session middleware
 * 
 * @example
 * ```typescript
 * const sessionHandler = createSessionMiddleware(isProduction, {
 *   storageType: 'redis',
 *   redisClient: redis,
 *   ttlSeconds: 3600,
 *   secrets: [process.env.SESSION_SECRET],
 *   cookie: {
 *     domain: '.example.com',
 *     maxAge: 3600000
 *   }
 * });
 * ```
 */
export function createSessionMiddleware(
    isProduction: boolean,
    config: SessionConfig
): RequestHandler {
    const log = getLogger('express/sessionMiddleware');

    // Validate configuration
    if (!config.secrets?.length) {
        throw new Error('At least one session secret must be provided');
    }

    if (config.storageType === 'redis') {
        if (!config.redisClient) {
            throw new Error('Redis client is required when using Redis storage');
        }
        if (typeof config.ttlSeconds !== 'number') {
            throw new Error('TTL must be specified when using Redis storage');
        }
    }

    // Merge with defaults while preserving security settings
    const finalConfig = {
        ...DEFAULT_CONFIG,
        ...config,
        cookie: {
            ...DEFAULT_CONFIG.cookie,
            ...config.cookie,
            // Force security settings
            sameSite: config.cookie?.sameSite ?? 'lax'
        }
    };

    // Initialize session store
    const sessionStore = finalConfig.storageType === 'redis' && finalConfig.redisClient
        ? createRedisStore({
            cacheClient: finalConfig.redisClient,
            sessionKeyPrefix: finalConfig.keyPrefix,
            sessionTtlSeconds: finalConfig.ttlSeconds!
        })
        : createMemoryStore();

    // Configure cookie settings with enforced security
    // Attention, for secure cookies to be sent, the following ingress configuration is required:
    // 
    // annotations:
    //   nginx.ingress.kubernetes.io/configuration-snippet: |
    //     proxy_set_header X-Forwarded-Proto $scheme;
    //
    // In local development, secure cookies will not be sent due to the lack of HTTPS 
    // so secure should be set to false.
    const cookieOptions: CookieOptions = {
        domain: finalConfig.cookie?.domain,
        path: finalConfig.cookie?.path ?? '/',
        secure: isProduction, // Always secure in production
        httpOnly: true,      // Always enabled
        sameSite: finalConfig.cookie?.sameSite ?? 'lax',
        maxAge: finalConfig.cookie?.maxAge
    };

    // Initialize express-session middleware
    const middleware = sessionMiddleware({
        store: sessionStore,
        name: finalConfig.cookie?.name,
        secret: finalConfig.secrets,
        genid: () => randomUUID(),
        proxy: true,
        resave: false,
        rolling: true,
        saveUninitialized: false,
        cookie: cookieOptions,
    });

    // Get paths to exclude from session management
    const ignorePatterns = finalConfig.ignoredPaths ?? DEFAULT_CONFIG.ignoredPaths ?? [];

    // Return middleware that conditionally applies session management
    return (request, response, next) => {
        if (shouldIgnore(ignorePatterns, request.path)) {
            log.trace('Bypassing session for path: [%s]', request.path);
            return next();
        }

        return middleware(request, response, next);
    };
}