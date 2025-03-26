import type { Request, Response } from 'express';

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
