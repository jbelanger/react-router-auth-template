import { createMsalProvider } from '@gc-fwcs/auth';
import { createRedisCacheClient } from '@gc-fwcs/session';
import { getServerEnv } from '~/utils/env.utils';

const env = getServerEnv();

export const redisCacheClient = await createRedisCacheClient({
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
