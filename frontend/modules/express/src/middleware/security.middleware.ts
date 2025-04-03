import { shouldIgnore } from '@gc-fwcs/helpers';
import { getLogger } from '@gc-fwcs/logger';
import type { RequestHandler } from 'express';

// @see: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
export async function securityHeaders(): Promise<RequestHandler> {
   const log = getLogger('express.server/securityHeadersRequestHandler');
   const ignorePatterns: string[] = [];

   // prettier-ignore
   const permissionsPolicy = [
    'camera=()',
    'display-capture=()',
    'fullscreen=()',
    'geolocation=()',
    'interest-cohort=()',
    'microphone=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
  ].join(', ');

   return (request, response, next) => {
      if (shouldIgnore(ignorePatterns, request.path)) {
         log.trace('Skipping adding security headers to response: [%s]', request.path);
         return next();
      }

      log.debug('Adding security headers to response');

      response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      response.setHeader('Permissions-Policy', permissionsPolicy);
      response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.setHeader('Server', 'webserver');
      response.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-Frame-Options', 'deny');

      next();
   };
}
