# React Router Auth Template (RRAT) AI Instructions

_Key Tech: React Router v7, Express, Microsoft Entra ID (Azure AD), Redis, Tailwind, MSAL Node, .NET 8 API._
_Structure: PNPM monorepo with `frontend/apps/auth-demo/app` and modular architecture._

## CORE AI DEVELOPMENT DIRECTIVES

1.  **Code Quality & Style:** Prioritize clear, simple, concise, self-documenting code. Comments only for complex logic, `// TODO:`, or to clarify non-obvious choices.
2.  **Server-Centric (RRv7 + Express):** Follow React Router v7 with Express middleware patterns detailed below.
3.  **External Guides:** Follow `CLAUDE.md` for project structure and development commands. Reference auth architecture documentation in `docs/` directory.
4.  **TypeScript & Pragmatic Typing:** Use TS with proper module typing. Follow `@gc-fwcs/` module patterns. If AI loops on type errors >2-3x, use `any` with `// TODO: Refine type - AI unblock`.
5.  **File/Component Splitting:** If files >400-500 lines OR AI struggles, suggest/implement splitting. Balance for AI context.
6.  **Module Services:** Use `frontend/modules/[moduleName]/src/` for reusable business logic.
7.  **`routes.ts` Updates:** Manually update `frontend/apps/auth-demo/app/routes.ts` for new page routes.
8.  **Consistency & Existing Patterns:** Strictly adhere to established RRAT patterns and PNPM workspace conventions.
9.  **Living Instructions:** This document evolves over time (see "PATTERN EVOLUTION").
10. **Security:** Never access/modify `.env*`, Azure AD configs, JWT secrets, Redis credentials, or authentication tokens. Use server-side session management only.

## REACT ROUTER V7 - DATA API SPECIFICS

- **Core Principle:** Use React Router v7 data APIs exclusively.
- **No `@remix-run/*` Imports For:** Core routing, loader/action args, data hooks, Form component, redirect/json utilities. **USE `react-router` or native Web APIs.**
- **Loaders Return:** Plain JavaScript objects (e.g., `return { myData };`).
- **Actions Return/Throw:**
  - Success Data (no redirect): Plain JavaScript objects (e.g., `return { success: true, someData };`).
  - Errors/Redirects: `throw new Response(...)`.
    - Validation Errors: `throw new Response(JSON.stringify({ errors, defaultValues }), { status: 400, headers: { 'Content-Type': 'application/json' } });`
    - Redirects: `throw new Response(null, { status: 302, headers: { Location: "/new-path" } });`

## PATTERN EVOLUTION & AI INTERACTION

- **Proposing New Patterns:** State proposed change and ask: "Update .cursorrules (or equivalent instruction file) with this new pattern?"
- **Confidence Rating:** Provide 1-10 scale before complex tasks, after saving files, after rejections
- **Assumptions/Uncertainties:** List explicitly before complex tasks

## FILE STRUCTURE & ORGANIZATION

**PNPM Monorepo Structure:**

```
├── `frontend/`: Frontend workspace root
│   ├── `apps/auth-demo/`: Main React Router application
│   │   ├── `app/`: React Router app directory
│   │   │   ├── `routes/`: Route modules by URL structure
│   │   │   ├── `routes.ts`: Manual updates needed for new routes
│   │   │   ├── `types/`: Application-specific types
│   │   │   ├── `utils/`: Application utilities
│   │   │   ├── `express.entry.server.ts`: Express server entry point
│   │   │   └── `app.css`: Global styles, Tailwind directives
│   │   ├── `public/`: Static assets and locales
│   │   └── `package.json`: App-specific dependencies
│   └── `modules/`: Shared workspace modules
│       ├── `@gc-fwcs/auth/`: MSAL authentication provider
│       ├── `@gc-fwcs/express/`: Express server and middleware
│       ├── `@gc-fwcs/session/`: Redis session management
│       ├── `@gc-fwcs/logger/`: Structured logging (Pino/Winston)
│       ├── `@gc-fwcs/helpers/`: Utility functions
│       ├── `@gc-fwcs/i18n/`: Internationalization
│       └── `@gc-fwcs/tsconfig/`: Shared TypeScript config
├── `backend/`: .NET 8 API with JWT authentication
│   └── `AuthBackend/`: Main API project
└── `docs/`: Architecture and authentication documentation
```

**Naming Conventions:**

- Components: `PascalCase.tsx`
- Module exports: Follow existing patterns in `@gc-fwcs/` modules
- Route Files: `kebab-case` directories, `.` for nesting, `$` for dynamic, `_index.tsx` for parent, `_layout.tsx` for layout, `.protected.tsx` for auth-required routes
- Hooks: `useCamelCase.ts`
- Types: `PascalCase.ts` and interface definitions
- Utilities: `camelCase.ts` or `kebab-case.ts`

## CODE ORGANIZATION & ARCHITECTURE

### Express Middleware Architecture

- **Location:** `frontend/modules/express/src/middleware/`
- **Purpose:** Comprehensive middleware stack for security, sessions, logging, and error handling
- **Implementation:** Express middleware called from `express.entry.server.ts`

### Authentication & Session Management

- **Auth Module:** `frontend/modules/auth/src/` - MSAL Node integration with Azure AD
- **Session Module:** `frontend/modules/session/src/` - Redis-backed session storage
- **Security:** Server-side token management, zero client-side token exposure
- **Pattern:** Use `auth.utils.server.ts` for authentication helpers in routes

### Module-Based Architecture

- **Location:** `frontend/modules/@gc-fwcs/[moduleName]/src/`
- **Purpose:** Reusable functionality across applications
- **Implementation:** Workspace dependencies using `workspace:*` protocol
- **AI Error Handling:** Follow existing module patterns; if errors persist, use `any` with TODO comments

### React Router Patterns

**Loaders:**

```typescript
import type { LoaderFunctionArgs } from "react-router";
import { getAuthenticatedUser } from "~/utils/auth.utils.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  // For protected routes
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const entityId = params.entityId;
  if (!entityId) throw new Response("ID is required", { status: 400 });

  // Call .NET backend API with authenticated user token
  const response = await fetch(`${process.env.API_BASE_URL}/api/entities/${entityId}`, {
    headers: {
      'Authorization': `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Response("Entity Not Found", { status: 404 });
  }

  const entity = await response.json();
  return { entity, user }; // Plain JS object
}
```

**Actions:**

```typescript
import type { ActionFunctionArgs } from "react-router";
import { getAuthenticatedUser } from "~/utils/auth.utils.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const entityId = params.entityId;
  const formData = await request.formData();

  try {
    // Call .NET backend API with form data
    const response = await fetch(`${process.env.API_BASE_URL}/api/entities/${entityId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.fromEntries(formData))
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Response(
        JSON.stringify({ errors: errorData }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Redirect on success
    throw new Response(null, {
      status: 302,
      headers: { Location: `/auth-demo/${entityId}` },
    });

  } catch (e) {
    if (e instanceof Response) throw e;
    
    throw new Response(
      JSON.stringify({
        errors: { form: "Update failed. Please try again." },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
```

### Form Handling

- **Validation:** Use React Router native form handling or integrate with validation libraries as needed
- **Components:**
  - Use Tailwind CSS for styling forms
  - Follow React Router v7 Form component patterns
  - Consider integrating with existing UI patterns in demo routes
- **Error Handling:**
  - Handle authentication errors by redirecting to auth flow
  - Return validation errors in consistent JSON format
  - Use React Router's error boundaries for unhandled errors
- **Form State:** Use React Router's native form state and navigation state
- **Form Structure Pattern:**

```typescript
import { Form, useNavigation } from "react-router";

// Usage in JSX
function MyForm() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Form method="post" className="space-y-6">
      <div>
        <label htmlFor="fieldName" className="block text-sm font-medium">
          Field Name
        </label>
        <input
          id="fieldName"
          name="fieldName"
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </Form>
  );
}
```

**Action Pattern for Forms:**

```typescript
export async function action({ request }: ActionFunctionArgs) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  try {
    // Call .NET backend API
    const response = await fetch(`${process.env.API_BASE_URL}/api/my-endpoint`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { errors: errorData };
    }

    const result = await response.json();

    // Redirect on success
    throw new Response(null, {
      status: 302,
      headers: { Location: `/auth-demo/success/${result.id}` },
    });
  } catch (e) {
    if (e instanceof Response) throw e;

    return {
      errors: {
        form: e instanceof Error ? e.message : "Operation failed. Please try again.",
      },
    };
  }
}
```

## .NET BACKEND API & DATA

- **API Client:** Call backend API endpoints with authenticated user tokens
- **Data Source:** .NET 8 API with Entity Framework and SQL Server (typically)
- **Fetching:** Use standard HTTP methods (GET, POST, PUT, DELETE) with proper Authorization headers
- **Authentication:** Include `Bearer ${user.accessToken}` header for all authenticated requests
- **Error Handling:** Handle API response status codes and error objects

### API Integration Patterns

- **Protected Endpoints:** Always include Authorization header with valid JWT token
- **Error Responses:** Backend returns structured error objects; handle appropriately in frontend
- **Data Transformation:** Backend API handles data validation and business logic
- **Type Safety:** Define TypeScript interfaces matching backend DTOs/models
  ```typescript
  interface UserData {
    id: string;
    email: string;
    name: string;
    roles: string[];
  }
  ```

### Authentication Flow Integration

- **Token Management:** Tokens are managed server-side via Redis sessions
- **API Calls:** Use `getAuthenticatedUser()` to get current user and access token
- **Session Handling:** Express middleware automatically manages session lifecycle
- **Redirect Patterns:** Unauthenticated users redirected to Azure AD login flow

## RRAT IMPLEMENTATION NOTES

- **Navigation:** Use React Router `Link` and `NavLink` components for navigation
- **Authentication UI:** Leverage existing auth demo routes for authentication patterns
- **Layout Patterns:** Follow existing `_layout.tsx` patterns in demo routes
- **Internationalization:** Use `@gc-fwcs/i18n` module for multi-language support
- **Demo Routes:** Reference existing demo routes for implementation patterns:
  - `/auth-demo` - Authentication flow demonstration
  - `/express-demo` - Express middleware showcase
  - `/session-demo` - Session management examples
  - `/logger-demo` - Logging functionality
  - `/helpers-demo` - Utility functions
  - `/i18n-demo` - Internationalization examples

## KEY TECHNOLOGIES & LIBRARIES

- **Frontend Framework:** React Router v7 with Express.js server
- **Authentication:** MSAL Node with Microsoft Entra ID (Azure AD)
- **Session Management:** Redis with Express sessions
- **Styling:** Tailwind CSS exclusively
- **Backend API:** .NET 8 with JWT authentication
- **Package Management:** PNPM workspace (>=10.6.2 required)
- **Development:** TypeScript with strict configuration

## OTHER KEY PRINCIPLES

- **Security First:** All authentication tokens remain server-side. Use HTTPS in production. Follow OWASP guidelines.
- **Error Handling:** Server-side logic should use `try/catch`. Loaders/actions **must** `throw new Response(...)` for errors intended for client/React Router. UI consumes via route `ErrorBoundary` or component `useRouteError()`.
- **State Management:** Strongly prefer server state via RR data APIs and Express sessions. Minimal client state (`useState`, `useReducer`) for UI-only concerns. Avoid complex global client state.
- **Development Commands:** Use PNPM commands from CLAUDE.md. Always run from appropriate directory (`frontend/` for frontend, `backend/` for .NET API).

## COMMON IMPORTS

```typescript
// React Router
import {
  Form,
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useActionData,
  useSubmit,
  useNavigation,
  useParams,
  useRouteError,
} from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

// Authentication
import { getAuthenticatedUser } from "~/utils/auth.utils.server";
import type { UserData } from "~/types/user-data";

// Modules
import { createExpressServer } from "@gc-fwcs/express";
import { MSALProvider } from "@gc-fwcs/auth";
import { SessionManager } from "@gc-fwcs/session";
import { logger } from "@gc-fwcs/logger";

// Environment & Configuration
import { getEnvVar } from "~/utils/env.utils";

// React & TypeScript
import type { ReactNode } from "react";

// Utilities for common tasks
import { cn } from "~/utils/cn"; // if using utility classes
```

## DEVELOPMENT WORKFLOW

1. **Frontend Development:**
   ```bash
   cd frontend
   pnpm dev  # Start development server
   ```

2. **Backend Development:**
   ```bash
   cd backend
   dotnet run --project AuthBackend
   ```

3. **Quality Checks:**
   ```bash
   cd frontend
   pnpm lint      # ESLint
   pnpm tsc       # TypeScript check
   pnpm format    # Prettier
   ```

4. **Environment Setup:**
   - Ensure Redis is running for sessions
   - Configure Azure AD credentials
   - Set API_BASE_URL for backend communication
