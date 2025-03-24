import { createMsalProvider } from "@gc-fwcs/auth";
import { createRedisCacheClient } from "@gc-fwcs/session";

export const redisCacheClient = await createRedisCacheClient({
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    commandTimeoutSeconds: process.env.REDIS_COMMAND_TIMEOUT_SECONDS ? parseInt(process.env.REDIS_COMMAND_TIMEOUT_SECONDS) : undefined,
});

export const authProvider = await createMsalProvider({

    cookie: {
        name: "auth_user_id", // This is now used for the user ID cookie
        secrets: [process.env.SESSION_SECRET || "s3cr3t"],
        maxAge: 60 * 60 * 24 * 7, // 1 week        
    },

    auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        tenantId: process.env.MICROSOFT_TENANT_ID!,
        // Optional custom scopes (has defaults)
        scopes: ["openid", "profile", "email", "offline_access"/*, "api://984811fc-a136-49c5-be47-c009047f9201/access_as_user"*/],
        redirectUri: (process.env.BASE_URL || "http://localhost:3000") + "/auth/callback",
    },

    // Required backend API configuration
    backendApi: {
        url: process.env.BACKEND_API_URL!,
        jwtSecret: process.env.JWT_VERIFICATION_KEY!,
    },

    redisClient: redisCacheClient
});