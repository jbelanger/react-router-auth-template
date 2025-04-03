import { getLogger } from '@gc-fwcs/logger';
import type { ErrorRequestHandler } from 'express';
import path from 'path';

/**
 * Global error handler middleware.
 * This middleware is used to catch any unhandled errors in the application.
 * It will log the error and then serve an appropriate error page.
 * @param cwd The current working directory of the application.
 */
export function globalErrorMiddleware(cwd: string): ErrorRequestHandler {
   const log = getLogger('express/globalErrorHandler');
   return (error, request, response, next) => {
      log.error(error);

      if (response.headersSent) {
         return next(error);
      }

      const errorFile = path.join(process.cwd(), cwd, response.statusCode === 403 ? '/403.html' : '/500.html');

      response.status(response.statusCode).sendFile(errorFile, (dispatchError: unknown) => {
         if (dispatchError) {
            log.error(dispatchError);
            response.status(500).send('Internal Server Error');
         }
      });
   };
}
