# React Router Auth Template (RRAT)

---

## Overview

This is a **proof-of-concept** that explores secure authentication patterns for modern web applications. Built as the foundation for the **FWCSS project**, this POC demonstrates how to implement Microsoft Entra ID authentication with React Router v7 and a .NET backend, focusing on server-side token management and session handling.

The project goes beyond simple authentication to include internationalization, structured logging, and other patterns commonly needed in real-world applications.

---

## What This Project Demonstrates

### Authentication & Security
- Microsoft Entra ID (Azure AD) integration using OAuth 2.0/OIDC
- PKCE (Proof Key for Code Exchange) flow implementation
- Server-side token storage (tokens never exposed to browser)
- JWT token enrichment with custom claims from .NET API
- Role-based access control with server-side validation
- Session management with Redis for scalability

### Application Architecture
- **Backend-for-Frontend (BFF) pattern**: Express middleware layer between React Router and .NET API
- **Monorepo structure**: PNPM workspace with shared modules
- **Server-side rendering**: React Router v7 with Express integration
- **Distributed sessions**: Redis-backed session storage with fallback to memory store

### Development Patterns
- **Structured logging** with Pino for performance
- **Correlation ID tracking** across requests for debugging
- **Internationalization (i18n)** with localized routing in both English and French
- **Type-safe development** with shared TypeScript configurations
- **Security headers** and CSRF protection middleware

---

## Project Structure

```
├── backend/                 # .NET 8 Web API
│   └── AuthBackend/        # Authentication and token enrichment services
├── frontend/               # React Router + Express application
│   ├── apps/              # Main application
│   └── modules/           # Shared libraries
│       ├── auth/          # MSAL authentication module
│       ├── session/       # Redis session management
│       ├── express/       # Express server utilities
│       ├── logger/        # Structured logging
│       ├── i18n/          # Internationalization
│       └── helpers/       # Common utilities
└── docs/                  # Architecture documentation
```

## Key Learning Areas

This POC explores several important concepts:

### Security Implementation
- How to keep OAuth tokens secure by never exposing them to the browser
- Implementing proper session management with secure cookies
- CSRF and XSS protection strategies
- Token refresh patterns for seamless user experience

### Scalable Architecture
- Using Redis for distributed session storage
- Implementing correlation IDs for request tracing
- Structured logging for production debugging
- Modular code organization with workspace dependencies

### Modern Web Development
- React Router v7 with server-side rendering
- Express middleware integration with React Router
- TypeScript across the full stack
- Development vs production configuration management

### Internationalization
- URL-based language switching (`/products` vs `/produits`)
- Server-side translation rendering
- Type-safe translation keys
- Language detection and fallback handling

---

## Technical Stack

**Frontend:**
- React Router v7 (SSR)
- Express.js with middleware stack
- TypeScript
- Vite for development and building
- TailwindCSS for styling

**Backend:**
- .NET 8 Web API
- Microsoft Identity Web for JWT validation
- Custom token enrichment service

**Infrastructure:**
- Redis for session storage
- PNPM workspaces for monorepo management
- Docker support for deployment

---

## Getting Started

### Prerequisites
- Node.js 22+
- PNPM 10.6.2+
- .NET 8 SDK  
- Redis server
- Microsoft Entra ID app registration

### Development Setup

1. **Start the backend API:**
```bash
cd backend
dotnet run --project AuthBackend
```

2. **Start the frontend application:**
```bash
cd frontend
pnpm install
pnpm dev
```

3. **Configure environment variables** for Azure AD integration and Redis connection

The application will be available at `http://localhost:5173`

### Available Commands
```bash
# Frontend development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm format           # Format code

# Backend development
dotnet build          # Build the API
dotnet test           # Run tests
```

---

## What I Learned Building This

- **Token Security**: How to properly handle OAuth tokens without exposing them to client-side JavaScript
- **Session Management**: Implementing distributed sessions that work across multiple server instances  
- **MSAL Integration**: Working with Microsoft's authentication library in a server-side context
- **Monorepo Organization**: Structuring shared code across multiple packages with proper TypeScript support
- **Production Considerations**: Handling token refresh, error boundaries, security headers, and logging

This project helped me understand the complexity involved in building secure, scalable web applications and the various trade-offs between security, performance, and developer experience.

---

## Areas for Improvement

As a learning project, there are several areas that could be enhanced:

- Additional test coverage, especially for authentication flows
- More comprehensive error handling and user feedback
- Performance monitoring and metrics collection
- Additional security hardening measures
- CI/CD pipeline setup
- More robust deployment strategies

---

## Documentation

- [Authentication Architecture](docs/auth.md) - Detailed explanation of the security implementation
- [Security Research](docs/auth-deep-research.md) - Background research on OAuth security best practices
- [Development Guide](CLAUDE.md) - Development workflow and commands
- Individual module READMEs in `frontend/modules/*/README.md`

---

## License

AGPL-3.0 - This is a learning project and proof-of-concept.

---

*This project was built to explore modern authentication patterns and served as the foundation for the FWCSS project. It represents my learning journey in building secure, full-stack web applications.*