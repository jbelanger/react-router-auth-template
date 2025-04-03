import type { Route } from './+types/api.protected-data';
import { ensureUserHasApiAccess } from '~/utils/auth.utils.server';

export async function loader({ context, request }: Route.LoaderArgs) {
   try {
      // Get the authenticated user (which will refresh tokens if needed)
      const user = await ensureUserHasApiAccess(context.session, request);
      const accessToken = user.apiToken;

      // Make an authenticated request to the backend API
      const response = await fetch(`${process.env.BACKEND_API_URL}/api/protected-data`, {
         headers: {
            Authorization: `Bearer ${accessToken}`,
         },
      });

      if (!response.ok) {
         throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
   } catch (error) {
      // Handle auth errors (redirects to login if needed)

      console.error('API request failed:', error);
      throw { error: 'Failed to fetch data from backend API' };
   }
}
