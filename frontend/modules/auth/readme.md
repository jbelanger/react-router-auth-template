# @gc-fwcs/auth

A reusable authentication module for web applications that provides Microsoft Entra ID (Azure AD) authentication using the Microsoft Authentication Library (MSAL).

## Features

- Microsoft Entra ID authentication with MSAL
- PKCE (Proof Key for Code Exchange) flow for secure authentication
- Distributed token caching with Redis support
- Session-based authentication state management
- Token refresh and silent authentication
- Structured error handling

## Installation

This is a workspace-only package and is not published to npm. Add it to your project using your monorepo's workspace dependencies:

```json
{
   "dependencies": {
      "@gc-fwcs/auth": "workspace:*"
   }
}
```

## Quick Start

```typescript
import { createMsalProvider } from '@gc-fwcs/auth';
import { createClient } from 'redis';

// Create Redis client
const redisClient = createClient({
   url: process.env.REDIS_URL,
});
await redisClient.connect();

// Create auth provider
const authProvider = await createMsalProvider({
   auth: {
      clientId: process.env.ENTRA_CLIENT_ID,
      clientSecret: process.env.ENTRA_CLIENT_SECRET,
      tenantId: process.env.ENTRA_TENANT_ID,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      redirectUri: 'https://example.com/auth/callback',
   },
   redisClient,
});

// Use the auth provider in your application
export { authProvider };
```

## API Reference

### `createMsalProvider(config: AuthConfig): Promise<AuthProvider>`

Creates a Microsoft Authentication Library (MSAL) provider configured with the given options.

**Parameters:**

- `config`: Configuration object for authentication

**Returns:**

- Promise that resolves to an `AuthProvider` instance

### AuthProvider Interface

The `AuthProvider` interface provides these main methods:

#### `generateAuthorizationUrl(session: Session, returnUrl?: string): Promise<string>`

Generates an authorization URL to initiate the OIDC login flow.

**Parameters:**

- `session`: User's session for storing PKCE and state
- `returnUrl`: URL to redirect to after successful authentication (defaults to '/')

**Returns:**

- Promise that resolves to the authorization URL

#### `exchangeCodeForTokens(session: Session, request: Request): Promise<{authResult: AuthenticationResult; redirectTo: string;}>`

Exchanges authorization code for access tokens.

**Parameters:**

- `session`: User's session containing PKCE verifier and state
- `request`: The incoming request with authorization code

**Returns:**

- Promise that resolves to an object containing authentication result and redirect URL

#### `refreshAccessToken(session: Session): Promise<{authResult: AuthenticationResult | null;}>`

Silently acquires a new access token using refresh token from cache.

**Parameters:**

- `session`: User's session containing homeAccountId

**Returns:**

- Promise that resolves to an object containing new auth result or null if no cached tokens found

#### `logout(session: Session, request: Request, returnPath?: string): Promise<string>`

Signs out the user by clearing tokens and redirecting to identity provider's logout endpoint.

**Parameters:**

- `session`: User's session to clear cached tokens
- `request`: Current request to derive origin for absolute URLs
- `returnPath`: Relative path to redirect to after logout (defaults to "/")

**Returns:**

- Promise that resolves to the URL to complete the logout process

## Configuration Options

### AuthConfig

```typescript
interface AuthConfig {
   // Microsoft authentication configuration
   auth: {
      clientId: string; // Microsoft client ID (Application ID)
      clientSecret: string; // Microsoft client secret
      tenantId: string; // Microsoft tenant ID
      authority?: string; // Authority URL (optional)
      scopes?: string[]; // OAuth scopes to request
      redirectUri: string; // Full URL for OAuth callbacks
   };

   // Redis client for distributed caching
   redisClient: RedisClientType;

   // Cache configuration options
   cache?: {
      ttl?: number; // Token cache TTL in seconds (default: 24 hours)
   };
}
```

## Error Handling

The module uses a standardized `AuthError` class that includes:

- `message`: Descriptive error message
- `code`: Error code for programmatic handling

Common error codes include:

- `LOGOUT_ERROR`: Failed to sign out user
- `CALLBACK_ERROR`: Authentication callback failed
- `TOKEN_REFRESH_ERROR`: Authentication expired or refresh failed
- `METADATA_ERROR`: Failed to fetch authentication configuration

## Integration Examples

### Example with a React Router Auth Route Handler

```typescript
// auth-route.js
import { authProvider } from './auth-config';

export async function loader({ request, context }) {
   const { session } = context;
   const { pathname } = new URL(request.url);

   // Check the path to determine operation
   if (pathname.endsWith('/login')) {
      return await authProvider.generateAuthorizationUrl(session);
   } else if (pathname.endsWith('/callback')) {
      return await authProvider.exchangeCodeForTokens(session, request);
   } else if (pathname.endsWith('/logout')) {
      return await authProvider.logout(session, request);
   }

   // Handle unknown paths
   return new Response('Not found', { status: 404 });
}
```

## Dependencies

- `@azure/msal-node`: Microsoft Authentication Library for Node.js
- `@azure/msal-common`: Shared MSAL components
- `@gc-fwcs/logger`: Logging utilities
- `@gc-fwcs/session`: Session management
- `@gc-fwcs/helpers`: Common helper functions
- `redis`: Redis client for distributed caching

## License

AGPL-3.0
