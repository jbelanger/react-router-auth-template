import { getLogger } from '@gc-fwcs/logger';
import type { Route } from './+types/$';
import { initiateAuthFlow, processAuthCallback, processUserLogout } from '~/utils/auth.utils.server';

/**
 * A do-all authentication handler for the application
 */
export async function loader({ context, params, request }: Route.LoaderArgs) {
  const log = getLogger('auth.$/loader');
  const { '*': slug } = params;

  switch (slug) {
    case 'login': {
      return await initiateAuthFlow(context.session, request);
    }
    case 'callback': {
      return await processAuthCallback(context.session, request);
    }
    case 'logout': {
      return await processUserLogout(context.session, request);
    }
    default: {
      log.warn('Invalid authentication route requested: [%s]', slug);
      return Response.json(null, { status: 404 });
    }
  }
}
