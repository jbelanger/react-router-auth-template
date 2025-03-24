import { createMsalProvider } from '@gc-fwcs/auth';
import { createExpressApp } from '@gc-fwcs/express';
import { createRedisCacheClient } from '@gc-fwcs/session';
import { getServerEnv } from '~/utils/env.utils';

const env = getServerEnv();
const isProduction = env.NODE_ENV === 'production';

const redisCacheClient = await createRedisCacheClient({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    operationTimeoutSeconds: env.REDIS_COMMAND_TIMEOUT_SECONDS,
});

export const authProvider = await createMsalProvider({
    auth: {
        clientId: env.AUTH_CLIENT_ID,
        clientSecret: env.AUTH_CLIENT_SECRET,
        tenantId: env.AUTH_TENANT_ID,
        scopes: env.AUTH_SCOPES,
        redirectUri: env.BASE_URL + '/auth/callback',
    },
    redisClient: redisCacheClient,
});

export const expressServer = await createExpressApp({
    cwd: isProduction ? './build/server' : './',
    mode: env.NODE_ENV,
    session: {
        storageType: env.SESSION_STORAGE_TYPE,
        secrets: [env.SESSION_COOKIE_SECRET],
        redisClient: redisCacheClient,
        ttlSeconds: env.SESSION_EXPIRES_SECONDS,
        cookie: {
            name: env.SESSION_COOKIE_NAME,
            domain: env.SESSION_COOKIE_DOMAIN,
            path: env.SESSION_COOKIE_PATH,
            sameSite: env.SESSION_COOKIE_SAME_SITE,
            maxAge: env.SESSION_EXPIRES_SECONDS * 1000, // Convert to milliseconds
        },
    },
    staticFiles: isProduction
        ? [
            { route: '/assets', dir: './build/client/assets', options: { immutable: true, maxAge: '1y' } },
            { route: '/locales', dir: './build/client/locales', options: { maxAge: '1d' } },
            { route: '/', dir: './build/client', options: { maxAge: '1y' } },
        ]
        : [
            { route: '/assets', dir: './public/assets' },
            { route: '/locales', dir: './public/locales', options: { maxAge: '1m' } },
            { route: '/', dir: './build/client', options: { maxAge: '1h' } },
        ],
    reactRouterEntryPoint: 'index.js',
});
