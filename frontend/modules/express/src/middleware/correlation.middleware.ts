import type { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setCorrelationContext } from '@gc-fwcs/logger';

/**
 * Creates middleware that adds correlation ID tracking to all requests.
 * Sets up async context for correlation ID and makes it available to
 * all logger instances through the request lifecycle.
 */
export function createCorrelationMiddleware(): RequestHandler {
    return (req, res, next) => {
        // Get correlation ID from header or generate new one
        const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

        // Add correlation ID to response headers
        res.setHeader('x-correlation-id', correlationId);

        // Run the rest of the request in a correlation ID context
        setCorrelationContext(correlationId, () => {
            // Make correlation ID available on request object for compatibility
            req.correlationId = correlationId;

            // Continue request processing
            const handleError = (err: Error) => {
                res.setHeader('x-correlation-id', correlationId);
                next(err);
            };

            try {
                next();
            } catch (err) {
                handleError(err as Error);
            }
        });
    };
}