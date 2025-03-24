# Authentication POC with .NET Backend and React Frontend

This project demonstrates a secure token-based authentication architecture using Microsoft Entra ID (formerly Azure AD) Single Sign-On (SSO) with a .NET backend API and a React frontend using React Router. The architecture ensures secure handling of tokens while enabling seamless authentication across the entire application.

## Project Structure

The project is organized as a monorepo containing:

- **Backend**: .NET 7 API for authentication and authorization services
- **Frontend**: React-based application with modular component libraries
- **Documentation**: Detailed authentication architecture and technical research

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

The system implements a secure token-based authentication flow with Microsoft Entra ID as the identity provider, using OAuth 2.0/OpenID Connect protocols.

### Key Authentication Features

1. **Server-Side Token Management**: All sensitive tokens (access, refresh tokens) remain server-side only
2. **PKCE Authentication Flow**: Uses Proof Key for Code Exchange for secure authentication
3. **Session-Based State**: Redis-backed sessions for maintaining auth state
4. **Automatic Token Refresh**: Background token refresh maintains valid sessions
5. **Role-Based Authorization**: Role capabilities from Entra ID claims

### Authentication Flow

1. User is redirected to Microsoft Entra ID login
2. Authorization code is returned to application callback endpoint
3. Backend exchanges code for tokens (access, ID, refresh)
4. Tokens are stored in server-side session (never exposed to client)
5. Application maintains authentication with token refresh

## Session Management

This project uses a Redis-backed session store to securely manage authentication state across the application:

- **Redis Session Storage**: Ensures session persistence and scalability
- **Express Session Middleware**: Handles session lifecycle and cookie management
- **Secure Session Cookies**: HTTPOnly, Secure cookies prevent client-side access
- **Consistent Authentication State**: Single source of truth for auth status

## Monorepo Structure

The frontend is structured as a monorepo using PNPM workspaces with these key components:

### Modules

The `@gc-fwcs` scoped packages provide reusable functionality across applications:

- **@gc-fwcs/auth**: Microsoft Entra ID authentication using MSAL
- **@gc-fwcs/express**: Express server utilities and middleware
- **@gc-fwcs/helpers**: Common utility functions
- **@gc-fwcs/logger**: Structured logging
- **@gc-fwcs/session**: Redis-backed session management
- **@gc-fwcs/tsconfig**: Shared TypeScript configurations

### Frontend Application

The `auth-with-reactrouter` application demonstrates a complete authentication implementation including:

- Protected routes with authentication guards
- Login/logout flows
- Token refresh handling
- Error handling for authentication failures

## Getting Started

### Prerequisites

- Node.js 16+
- PNPM package manager
- .NET 7.0 SDK
- Redis server (for session storage)

### Setup

1. Clone the repository
2. Configure environment variables:

#### Backend

```
cd backend
```

Create an `appsettings.Development.json` file with your Entra ID configuration.

#### Frontend

```
cd frontend
```

Create a `.env` file in the `apps/auth-with-reactrouter` directory with:

```
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-session-secret
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

## Security Considerations

- All tokens are kept server-side, never exposed to client JavaScript
- Session cookies use HTTPOnly, Secure, and SameSite flags
- PKCE flow protects against CSRF and authorization code interception
- Automatic token refresh maintains session validity
- API calls use short-lived tokens for authorization

## Learn More

For more details on the authentication architecture, see the dedicated documentation:

- [Authentication Architecture](docs/auth.md)
- [Authentication Deep Research](docs/auth-deep-research.md)
