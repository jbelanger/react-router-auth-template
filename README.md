# Authentication POC with Remix SSR and .NET Backend

This project demonstrates a secure token-based authentication architecture using Microsoft Entra ID (formerly Azure AD) with a .NET backend API and a Remix frontend. The architecture ensures that sensitive tokens remain server-side while providing seamless authentication and authorization throughout the application.

## Project Structure

The project is organized as a monorepo containing:

```
│
├── backend/               # .NET backend API
│   ├── AuthBackend/      # Authentication services API
│   └── backend.sln       # Solution file
│
├── frontend/             # Frontend monorepo workspace
│   ├── apps/             # Applications
│   │   └── auth-with-reactrouter/  # React Router-based auth demo
│   ├── modules/          # Shared modules/libraries
│   │   ├── auth/         # Authentication module
│   │   ├── express/      # Express integrations
│   │   ├── helpers/      # Utility helpers
│   │   ├── logger/       # Logging utilities
│   │   ├── session/      # Session management
│   │   └── tsconfig/     # TypeScript configuration
│   ├── package.json      # Workspace configuration
│   └── pnpm-workspace.yaml  # PNPM workspace definition
│
└── docs/                 # Documentation
    ├── auth.md           # Authentication architecture
    └── auth-deep-research.md  # Technical research
```

## Authentication Architecture

This project implements a secure token-based authentication system with Microsoft Entra ID as the identity provider, using OAuth 2.0/OpenID Connect protocols. Due to Remix's lack of middleware support, Express is used to provide consistent session management across the entire request pipeline.

### Authentication Flow

1. **User Authentication via Entra ID**

   - User attempts to access protected route
   - System redirects to Microsoft Entra ID login page
   - Entra ID authenticates the user and returns an authorization code
   - The authorization code is exchanged for tokens:
     - **ID Token**: Contains user identity information
     - **Access Token**: For accessing protected resources
     - **Refresh Token**: For obtaining new tokens without re-authentication

2. **Token Management**

   - All tokens are stored server-side in Redis sessions
   - Access tokens are refreshed before they expire
   - Tokens are never exposed to the client browser

3. **Session Management**

   - Express session middleware with Redis store
   - Secure HTTPOnly cookies for session identification
   - Session contains user identity and authentication state
   - Roles stored in session for authorization checks

4. **API Authorization**
   - Authenticated requests to .NET API include authorization header
   - API validates the token signature and claims
   - Role-based access control for protected endpoints

### MSAL Distributed Cache with Redis

The application implements Microsoft Authentication Library (MSAL) for Node.js with a custom Redis-backed distributed cache:

- **DistributedCachePlugin**: Implements MSAL Node's plugin interface for caching
- **Redis Cache**: Stores MSAL-specific cache entries like:
  - Token cache (access and refresh tokens)
  - Authority and cloud discovery metadata
  - Account information
- **Cache Partitioning**: Entries are partitioned by client/tenant IDs
- **Persistence**: Cache survives application restarts, enabling reliable token refresh
- **Scalability**: Supports multiple application instances sharing the same authentication state

This implementation provides:

- Improved token refresh reliability
- Efficient handling of OIDC metadata caching
- Performance optimization for token operations
- Better security through isolation of token storage

## Session Management

The project uses Express with Redis-backed sessions to securely manage authentication state:

- **Server-side Session Storage**: Redis ensures session persistence across server instances
- **Secure Cookies**: HTTPOnly, Secure, and SameSite cookies prevent client-side access
- **Session Encryption**: Data stored in sessions is encrypted
- **Rolling Sessions**: Session expiry extends with activity

## Monorepo Structure and Modules

The frontend is structured as a monorepo using PNPM workspaces:

### Core Authentication Module (@gc-fwcs/auth)

The `@gc-fwcs/auth` module provides:

- Microsoft Entra ID authentication using MSAL
- PKCE (Proof Key for Code Exchange) flow for secure authentication
- Token acquisition, caching, and refresh
- Session-based authentication state management

### Supporting Modules

- **@gc-fwcs/session**: Redis-backed session management with secure defaults
- **@gc-fwcs/express**: Express server utilities including middleware integration
- **@gc-fwcs/helpers**: Utility functions for error handling, validation, etc.
- **@gc-fwcs/logger**: Structured logging for application monitoring

## Security Model

This architecture implements these security principles:

1. **Zero Token Exposure**: Tokens are never exposed to client-side JavaScript
2. **Defense in Depth**: Multiple layers of validation throughout the stack
3. **Principle of Least Privilege**: Minimal permissions in access tokens
4. **Fresh Authentication**: Tokens refreshed regularly to maintain security
5. **No Client State**: Authentication state never stored in browser storage

## Protected Routes

The application implements protection at multiple levels:

1. **Route Protection**:

   - Routes requiring authentication redirect unauthenticated users to login
   - Role-based route access checks server-side before rendering
   - Client-side route guards provide redundant protection

2. **API Authorization**:
   - API endpoints require valid tokens
   - Role-based permissions verified on each request
   - Token validation with proper signature checks

## Getting Started

### Prerequisites

- Node.js 16+
- PNPM package manager
- .NET 7.0 SDK
- Redis server (for session storage)

### Environment Setup

Create appropriate environment files with these configurations:

#### Backend (.NET)

```json
{
  "Authentication": {
    "Authority": "https://login.microsoftonline.com/{your-tenant-id}",
    "ClientId": "{your-api-client-id}",
    "Audience": "{your-api-client-id}"
  }
}
```

#### Frontend (Remix)

```
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-secure-random-secret
BASE_URL=http://localhost:3000
```

### Running the Application

#### Backend

```
cd backend
dotnet run --project AuthBackend
```

#### Frontend

```
cd frontend
pnpm install
pnpm dev
```

## Learn More

For deeper understanding of the authentication architecture:

- [Authentication Architecture](docs/auth.md) - Detailed design explanation
- [Authentication Deep Research](docs/auth-deep-research.md) - Technical research
