# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the React Router Auth Template (RRAT) - a secure token-based authentication POC using Microsoft Entra ID (Azure AD) with a .NET backend API and React Router frontend. The architecture ensures sensitive tokens remain server-side while providing seamless authentication and authorization. The project uses Express middleware to overcome Remix's lack of middleware support, enabling consistent session management across the entire request pipeline.

## Development Commands

### Frontend (PNPM Monorepo)
```bash
cd frontend

# Development
pnpm dev              # Start development server for main app
pnpm dev:app          # Alternative command for main app

# Building
pnpm build            # Build main application
pnpm build:modules    # Build all workspace modules
pnpm build:app        # Build main app only

# Quality Assurance
pnpm test             # Run all tests across workspace
pnpm lint             # Lint all packages
pnpm tsc              # TypeScript check all packages
pnpm format           # Format code with Prettier

# Utilities
pnpm clean            # Clean all build artifacts
```

### Backend (.NET)
```bash
cd backend

# Development
dotnet run --project AuthBackend    # Start .NET API server
dotnet build                        # Build the solution
dotnet test                         # Run tests

# Production
dotnet publish --project AuthBackend -c Release
```

### Individual App Commands (auth-demo)
```bash
cd frontend/apps/auth-demo

# Development
pnpm dev              # Start with tsx and .env file
pnpm typecheck        # React Router typegen + TypeScript check

# Building
pnpm build            # Build both application and server
pnpm build:application # React Router build only
pnpm build:server     # Vite server build only

# Production
pnpm start            # Start production server
```

## Architecture Overview

### Monorepo Structure
- **Frontend**: PNPM workspace with shared modules and React Router app
- **Backend**: .NET 8 API with JWT authentication and Microsoft Identity integration
- **Modules**: Shared libraries for auth, express, session, logging, helpers, and i18n

### Key Components

#### Authentication Flow
1. **Microsoft Entra ID Integration**: Uses MSAL Node with PKCE flow
2. **Server-Side Token Management**: Tokens never exposed to client
3. **Redis-Backed Sessions**: Distributed session storage for scalability
4. **Express Middleware Stack**: Comprehensive security and session handling

#### Module Architecture
- **@gc-fwcs/auth**: MSAL authentication provider with Entra ID integration
- **@gc-fwcs/express**: Express server creation with middleware stack
- **@gc-fwcs/session**: Redis session management and secure cookie handling  
- **@gc-fwcs/logger**: Structured logging with Pino and Winston
- **@gc-fwcs/helpers**: Utility functions for error handling and path management
- **@gc-fwcs/i18n**: Internationalization with React Router and i18next

### Express Server Configuration
The Express server (`express.entry.server.ts`) is the main entry point that:
- Configures session middleware with Redis backend
- Sets up static file serving for different environments
- Integrates React Router with Express request handling
- Provides comprehensive middleware stack (security, logging, compression)

### Environment Requirements
- **Node.js**: >=22.0.0
- **PNPM**: >=10.6.2 (enforced by preinstall script)
- **Redis**: Required for session storage
- **.NET**: 8.0 SDK for backend API

## Key Implementation Details

### Session Management
- Redis-backed distributed sessions with configurable TTL
- Secure HTTPOnly cookies with proper SameSite settings
- Session exclusion patterns for health checks and public endpoints
- Different TTL for development (24h) vs production (1h)

### Security Model
- Zero token exposure to client-side JavaScript
- PKCE flow for secure authorization code exchange
- Server-side token refresh and management
- Role-based access control with claims validation
- Comprehensive security headers middleware

### TypeScript Configuration
- Shared TypeScript configuration via `@gc-fwcs/tsconfig` workspace package
- React Router typegen integration for type-safe routing
- Strict TypeScript settings across all packages

## Development Workflow

1. **Start Redis**: Ensure Redis server is running for session storage
2. **Backend API**: Start .NET API with `dotnet run --project AuthBackend`
3. **Frontend Dev**: Start frontend with `pnpm dev` from `/frontend`
4. **Environment**: Configure Azure AD credentials and Redis connection
5. **Testing**: Use `pnpm test` and `pnpm lint` before commits

## Important File Locations

- Express server entry: `/frontend/apps/auth-demo/app/express.entry.server.ts`
- Auth module: `/frontend/modules/auth/src/`
- Express module: `/frontend/modules/express/src/`
- Session management: `/frontend/modules/session/src/`
- .NET API: `/backend/AuthBackend/`
- Route definitions: `/frontend/apps/auth-demo/app/routes/`

## Notes for Development

- Always use PNPM for package management (enforced by preinstall hook)
- The project uses React Router v7 with Express integration
- Authentication state is managed server-side via Express sessions
- API calls to .NET backend include authorization headers with valid tokens
- Static file serving is configured differently for development vs production
- All modules use workspace protocol for internal dependencies (`workspace:*`)