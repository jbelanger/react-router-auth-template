import { getLogger } from '@gc-fwcs/logger';
import { initializeExpressServer } from '@gc-fwcs/express';
import { redisCacheClient } from '~/.server/configuration/dependencies';

const log = getLogger('server');
console.log('Starting server...');

// Environment variables with defaults and validation
const NODE_ENV = process.env.NODE_ENV as 'development' | 'production' ?? 'development';
const SESSION_STORAGE_TYPE = process.env.SESSION_STORAGE_TYPE as 'memory' | 'redis' ?? 'memory';
const PORT = process.env.PORT ?? '5173';
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

// Initialize server with validated configuration
initializeExpressServer(
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
        port: PORT,
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
    { startServer: true }
).catch((error: Error) => {
    log.error('Failed to start server:', error);
    process.exit(1);
});