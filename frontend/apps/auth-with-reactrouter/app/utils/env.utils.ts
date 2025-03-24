import { loggerEnvSchema } from '@gc-fwcs/logger';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

// transformers
const csvToArray = (csv?: string) => csv?.split(',').map((str) => str.trim()) ?? [];
const emptyToUndefined = (val?: string) => (val === '' ? undefined : val);
const toBoolean = (val?: string) => val === 'true';

/**
 * Environment variables that will be available to server only.
 */
// prettier-ignore
const serverEnv = z.object({
  NODE_ENV: z.enum(['production', 'development']),

  // Base URL for the frontend application
  BASE_URL: z.string().trim().min(1),

  // auth/oidc settings
  AUTH_CLIENT_ID: z.string().trim().min(1),
  AUTH_CLIENT_SECRET: z.string().trim().min(1),
  AUTH_TENANT_ID: z.string().trim().min(1),
  AUTH_SCOPES: z.string().transform(emptyToUndefined).transform(csvToArray).default("openid,profile,email,offline_access"),
  AUTH_METADATA_CACHE_TTL_SECONDS: z.coerce.number().default(24 * 60 * 60),

  // session configuration
  SESSION_STORAGE_TYPE: z.enum(['memory', 'redis']).default('memory'),
  SESSION_EXPIRES_SECONDS: z.coerce.number().default(1200),
  SESSION_COOKIE_NAME: z.string().trim().min(1).default('fwcs.sid'),
  SESSION_COOKIE_DOMAIN: z.string().trim().min(1).optional(),
  SESSION_COOKIE_PATH: z.string().trim().min(1).default('/'),
  SESSION_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  SESSION_COOKIE_SECRET: z.string().trim().min(16).default(randomUUID()),
  SESSION_COOKIE_HTTP_ONLY: z.string().transform(toBoolean).default('true'),
  SESSION_COOKIE_SECURE: z.string().transform(toBoolean).default('true'),
  SESSION_FILE_DIR: z.string().trim().min(1).default('./node_modules/cache/sessions/'),
  SESSION_KEY_PREFIX: z.string().trim().min(1).default('SESSION:'),


  // redis server configuration
  REDIS_HOST: z.string().trim().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_USERNAME: z.string().trim().optional(),
  REDIS_PASSWORD: z.string().trim().optional(),
  REDIS_COMMAND_TIMEOUT_SECONDS: z.coerce.number().default(1),

  // health check configuration
  HEALTH_CACHE_TTL: z.coerce.number().default(10 * 1000),
  HEALTH_AUTH_JWKS_URI: z.string().url().optional(),
  HEALTH_AUTH_ROLE: z.string().default('HealthCheck.ViewDetails'),
  HEALTH_AUTH_TOKEN_AUDIENCE: z.string().default('00000000-0000-0000-0000-000000000000'), // intentional default to enforce an audience check when verifying JWTs
  HEALTH_AUTH_TOKEN_ISSUER: z.string().default('https://auth.example.com/'), // intentional default to enforce an issuer check when verifying JWTs
  HEALTH_PLACEHOLDER_REQUEST_VALUE: z.string().default('CDCP_HEALTH_CHECK'),
});

export type ServerEnvConfig = z.infer<typeof serverEnv>;

export const getServerEnv = (env: NodeJS.ProcessEnv = process.env): ServerEnvConfig => {
  return serverEnv.parse(env);
};
