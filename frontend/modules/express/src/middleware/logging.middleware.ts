import { shouldIgnore } from '@gc-fwcs/helpers';
import { getLogger } from '@gc-fwcs/logger';
import type { RequestHandler } from 'express';
import morganMiddleware from 'morgan';

export function logging(isProduction: boolean): RequestHandler {
   const log = getLogger('express.server/loggingRequestHandler');
   const ignorePatterns: string[] = ['/api/readyz'];

   const logFormat = isProduction ? 'tiny' : 'dev';

   const middleware = morganMiddleware(logFormat, {
      stream: { write: (msg) => log.info(msg.trim()) },
   });

   return (request, response, next) => {
      if (shouldIgnore(ignorePatterns, request.path)) return next();
      return middleware(request, response, next);
   };
}
