import { createMsalProvider } from "@gc-fwcs/auth";
import { createExpressApp } from "@gc-fwcs/express";
import { getLogger } from "@gc-fwcs/logger";
import { createRedisCacheClient } from "@gc-fwcs/session";

export const redisCacheClient = await createRedisCacheClient({
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    operationTimeoutSeconds: process.env.REDIS_COMMAND_TIMEOUT_SECONDS ? parseInt(process.env.REDIS_COMMAND_TIMEOUT_SECONDS) : undefined,
});

export const authProvider = await createMsalProvider({
    auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        tenantId: process.env.MICROSOFT_TENANT_ID!,
        // Optional custom scopes (has defaults)
        scopes: ["openid", "profile", "email", "offline_access"/*, "api://984811fc-a136-49c5-be47-c009047f9201/access_as_user"*/],
        redirectUri: (process.env.BASE_URL || "http://localhost:3000") + "/auth/callback",
    },
    redisClient: redisCacheClient
});

// Initialize server with validated configuration
export const createExpressServer = async () => {
    const log = getLogger('server');

    // Environment variables with defaults and validation
    const NODE_ENV = process.env.NODE_ENV as 'development' | 'production' ?? 'development';
    const SESSION_STORAGE_TYPE = process.env.SESSION_STORAGE_TYPE as 'memory' | 'redis' ?? 'memory';
    const SESSION_SECRET = process.env.SESSION_SECRET;
    const SESSION_TTL_SECONDS = parseInt(process.env.SESSION_TTL_SECONDS ?? '3600', 10); // Default 1 hour

    // Runtime environment checks
    const isProduction = NODE_ENV === 'production';

    // Validate critical configuration
    if (!SESSION_SECRET) {
        log.error('SESSION_SECRET environment variable is required');
        process.exit(1);
    }

    if (SESSION_STORAGE_TYPE === 'redis' && !redisCacheClient) {
        log.error('Redis client is required when using Redis session storage');
        process.exit(1);
    }

    return await createExpressApp(
        {
            cwd: isProduction ? './build/server' : './',
            mode: NODE_ENV,
            session: {
                storageType: SESSION_STORAGE_TYPE,
                secrets: [SESSION_SECRET],
                redisClient: redisCacheClient,
                ttlSeconds: SESSION_TTL_SECONDS,
                cookie: {
                    name: 'fwcs.sid',
                    domain: undefined, // Let browser determine domain based on current hostname
                    path: '/',
                    sameSite: 'lax',
                    maxAge: SESSION_TTL_SECONDS * 1000 // Convert to milliseconds
                }
            },
            staticFiles: isProduction
                ? [
                    {
                        route: '/assets',
                        dir: './build/client/assets',
                        options: {
                            immutable: true,
                            maxAge: '1y'
                        }
                    },
                    {
                        route: '/locales',
                        dir: './build/client/locales',
                        options: {
                            maxAge: '1d'
                        }
                    },
                    {
                        route: '/',
                        dir: './build/client',
                        options: {
                            maxAge: '1y'
                        }
                    }
                ]
                : [
                    {
                        route: '/assets',
                        dir: './public/assets'
                    },
                    {
                        route: '/locales',
                        dir: './public/locales',
                        options: {
                            maxAge: '1m'
                        }
                    },
                    {
                        route: '/',
                        dir: './build/client',
                        options: {
                            maxAge: '1h'
                        }
                    }
                ],
            reactRouterEntryPoint: 'index.js'
        },
    )
};
