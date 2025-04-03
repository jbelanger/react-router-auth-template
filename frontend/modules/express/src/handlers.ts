import { createRequestHandler } from '@react-router/express';

import { createNullSession, createSession } from '@gc-fwcs/session';
import type { Session } from '@gc-fwcs/session';
import type { RequestHandler } from 'express';
import path from 'path';
import type { ViteDevServer } from 'vite';

/**
 * Context object passed to React Router loaders and actions.
 * Extends the base AppLoadContext to support arbitrary string keys
 * while providing type safety for known properties.
 */
export interface LoadContext {
   /** Type-safe session manager */
   session: Session;
   /** Correlation ID for request tracing */
   correlationId: string;
   /** Allow additional string-keyed properties */
   [key: string]: unknown;
}

/**
 * Creates a request handler for React Router applications.
 * This handler integrates session management and supports both
 * development and production environments.
 *
 * Features:
 * - Integrates with express-session
 * - Provides type-safe session access
 * - Supports Vite dev server
 * - Falls back to null session when no session exists
 *
 * @param mode Application mode ('development' or 'production')
 * @param cwd Current working directory for resolving build files
 * @param rrBuildFile React Router build file path (default: 'index.js')
 * @param viteDevServer Optional Vite dev server instance for development
 * @returns Express request handler
 *
 * @example
 * ```typescript
 * const handler = reactRouterRequestHandler(
 *   'production',
 *   'dist',
 *   'server/index.js'
 * );
 * app.use(handler);
 * ```
 */
export function reactRouterRequestHandler(
   mode: 'development' | 'production',
   cwd: string,
   rrBuildFile: string = 'index.js',
   viteDevServer?: ViteDevServer,
): RequestHandler {
   // Resolve the build file path
   const buildPath = path.join(process.cwd(), cwd, rrBuildFile);
   const buildUrl = new URL(`file://${buildPath}`).href;

   return createRequestHandler({
      mode,
      // Use Vite dev server in development, direct import in production
      build: viteDevServer
         ? async () => await viteDevServer.ssrLoadModule('virtual:react-router/server-build')
         : async () => await import(buildUrl),

      /**
       * Creates the loader context for React Router.
       * Provides a type-safe session manager through the context.
       * Falls back to a null session if no session exists.
       */
      getLoadContext: (request, response): LoadContext => ({
         session: request.session ? createSession(request.session) : createNullSession(),
         /**
          * Correlation ID for request tracing.
          * React Router has to manually use this to
          * the logging functions and api calls.
          */
         correlationId: request.correlationId || 'unknown',
      }),
   });
}
