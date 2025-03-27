import compression from 'compression';
import express from 'express';
import type { Express } from 'express';
import sourceMapSupport from 'source-map-support';
import { createViteDevServer } from './vite.server.ts';
import { getLogger } from '@gc-fwcs/logger';
import { securityHeaders } from './middleware/security.middleware.ts';
import { logging } from './middleware/logging.middleware.ts';
import { reactRouterRequestHandler } from './handlers.ts';
import { createSessionMiddleware } from './middleware/session.middleware.ts';
import type { SessionConfig } from './middleware/session.middleware.ts';
import { globalErrorMiddleware } from './middleware/error.middleware.ts';
import { Session } from '@gc-fwcs/session';

declare namespace Express {
        interface Request {
            correlationId: string;
        }
    }
    
    
    declare module 'react-router' {
        interface AppLoadContext {
            /** Type-safe session manager */
            session: Session;
            /** Correlation ID for request tracing */
            correlationId: string;
        }
    }

    
/** Valid Node environment modes */
export type NodeEnv = 'development' | 'production';

/** Vite development server configuration */
export interface ViteServerOptions {
    /** Path to Vite config file */
    configFile?: string;
    /** Inline Vite configuration */
    inlineConfig?: Record<string, unknown>;
}

/** Static file serving configuration */
export interface StaticFileConfig {
    /** URL route path */
    route: string;
    /** Directory to serve files from */
    dir: string;
    /** Express static options */
    options?: Parameters<typeof express.static>[1];
}

/**
 * Express server configuration.
 * Defines all settings needed to initialize and run the server.
 */
export interface ExpressServerConfig {
    /** Current working directory for resolving paths */
    cwd: string;
    /** Server operation mode */
    mode: NodeEnv;

    /**
     * Session configuration.
     * Controls session storage, cookie settings, and security options.
     * @see SessionConfig for detailed options
     */
    session: SessionConfig;

    /** 
     * Vite development server options.
     * Only used in development mode.
     */
    vite?: ViteServerOptions;

    /** 
     * Static file serving configuration.
     * Define routes and directories for static assets.
     */
    staticFiles?: StaticFileConfig[];

    /** 
     * React Router entry point file.
     * Relative to CWD.
     */
    reactRouterEntryPoint?: string;
}

/**
 * Default session TTL values in seconds
 */
const SESSION_TTL = {
    DEVELOPMENT: 24 * 60 * 60, // 24 hours
    PRODUCTION: 1 * 60 * 60,   // 1 hour
} as const;

/**
 * Default server configuration.
 * Provides secure defaults suitable for development.
 * Production deployments should override security-sensitive values.
 */
const defaultConfig: ExpressServerConfig = {
    cwd: './',
    mode: 'development',
    session: {
        storageType: 'memory',
        secrets: ['development-only-secret'],
        ttlSeconds: SESSION_TTL.DEVELOPMENT,
        cookie: {
            name: 'connect.sid',
            path: '/',
            sameSite: 'lax',
            maxAge: SESSION_TTL.DEVELOPMENT * 1000 // Convert to milliseconds
        }
    },
    staticFiles: [
        {
            route: '/',
            dir: './build/client',
            options: { maxAge: '1h' }
        }
    ],
    reactRouterEntryPoint: 'index.ts'
};

/**
 * Initializes and configures an Express server.
 * 
 * Features:
 * - Session management with Redis or in-memory storage
 * - Security headers
 * - Static file serving
 * - React Router integration
 * - Vite development server (in dev mode)
 * - Global error handling
 * - Source map support
 * 
 * @param config Server configuration (merged with defaults)
 * @returns Configured Express application that can be started by the client
 * 
 * @example
 * ```typescript
 * // Initialize the Express application
 * const app = await createExpressApp({
 *   mode: 'production',
 *   session: {
 *     storageType: 'redis',
 *     redisClient: redis,
 *     secrets: [process.env.SESSION_SECRET],
 *     ttlSeconds: 3600
 *   }
 * });
 * 
 * // Start the server (handled by client)
 * app.listen(3000, () => console.log('Server running on port 3000'));
 * ```
 */
export async function createExpressApp(
    config: Partial<ExpressServerConfig> = {}
): Promise<Express> {
    const log = getLogger('express.server');

    // Determine environment
    const isProduction = config.mode === 'production';

    // Set default TTL based on environment
    const defaultTtl = isProduction ? SESSION_TTL.PRODUCTION : SESSION_TTL.DEVELOPMENT;

    // Merge configuration with defaults
    const environment: ExpressServerConfig = {
        ...defaultConfig,
        ...config,
        session: {
            ...defaultConfig.session,
            ...config.session,
            // Ensure TTL is set appropriately
            ttlSeconds: config.session?.ttlSeconds ?? defaultTtl,
            cookie: {
                ...defaultConfig.session.cookie,
                ...config.session?.cookie,
                // Ensure cookie maxAge matches TTL
                maxAge: (config.session?.ttlSeconds ?? defaultTtl) * 1000
            }
        }
    };

    log.info('Validating runtime environment...');

    log.info('Installing source map support');
    sourceMapSupport.install();

    log.info(`Initializing %s mode express server...`, environment.mode);
    const viteDevServer = await createViteDevServer(isProduction);
    const app = express();

    log.info('  ✓ disabling X-Powered-By response header');
    app.disable('x-powered-by');

    log.info('  ✓ enabling reverse proxy support'); // Trust X-Forwarded-For header
    app.set('trust proxy', true);

    // Example error endpoint
    app.get('/api/test-express-error/:code', (req, res, next) => {
        const errorCode = parseInt(req.params.code);
        if (errorCode >= 400) {
            res.status(errorCode);
            return next(new Error(`Test error with code ${errorCode}`));
        } else {
            res.send(`Invalid error code: ${errorCode}`);
        }
    });

    log.info('  ✓ disabling X-Powered-By response header');
    app.disable('x-powered-by');

    log.info(' ‼️  configuring express middlewares...');

    log.info('    ✓ compression middleware');
    app.use(compression());

    log.info('    ✓ logging middleware');
    app.use(logging(isProduction));

    log.info('    ✓ configuring static file middleware');
    if (environment.staticFiles) {
        for (const staticFile of environment.staticFiles) {
            log.info(`      ✓ serving ${staticFile.dir} at ${staticFile.route}`);
            app.use(staticFile.route, express.static(staticFile.dir, staticFile.options));
        }
    }

    log.info('    ✓ security headers middleware');
    app.use(await securityHeaders());

    log.info('    ✓ session middleware (%s) with TTL: %ds',
        environment.session.storageType,
        environment.session.ttlSeconds
    );
    app.use(createSessionMiddleware(isProduction, environment.session));

    if (viteDevServer) {
        log.info('    ✓ vite dev server middlewares');
        app.use(viteDevServer.middlewares);
    }

    log.info('  ✓ registering react router request handler');
    app.all('*', reactRouterRequestHandler(
        environment.mode,
        environment.cwd,
        environment.reactRouterEntryPoint,
        viteDevServer
    ));

    log.info('  ✓ registering global error handler');
    app.use(globalErrorMiddleware(environment.cwd));

    log.info('Server initialization complete');
    return app;
}

export { createServerBuildConfig } from './vite.server.ts';
