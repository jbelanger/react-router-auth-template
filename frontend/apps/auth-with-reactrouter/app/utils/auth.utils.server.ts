import type { Session } from '@gc-fwcs/session';
import { jwtVerify } from 'jose';
import { redirectDocument } from 'react-router-dom';

import { authProvider } from '~/.server/configuration/dependencies';
import type { UserData } from '~/types/user-data';

/**
 * Initiates the authentication flow by attempting token refresh or redirecting to login
 * @param session - User's session for storing auth state
 * @param request - Incoming request containing return URL
 * @returns Redirect to either the return URL (if refresh succeeds) or the login page
 */
export async function initiateAuthFlow(session: Session, request: Request) {
   const { searchParams } = new URL(request.url);
   const returnUrl = searchParams.get('returnUrl') ?? '/';

   // Try to refresh first
   const { authResult } = await authProvider.refreshAccessToken(session);
   if (authResult) {
      return redirectDocument(returnUrl);
   }

   // TODO: Clear the session when relogging in. Cannot destroy the session here as it will break the generateAuthorizationUrl call
   //await session.regenerate();

   const authUrl = await authProvider.generateAuthorizationUrl(session, returnUrl);
   return redirectDocument(authUrl);
}

/**
 * Processes OAuth callback by exchanging code for tokens and creating user session
 * @param session - User's session for storing auth state and user data
 * @param request - Callback request containing authorization code
 * @returns Redirect to the originally requested URL
 */
export async function processAuthCallback(session: Session, request: Request) {
   const { authResult, redirectTo } = await authProvider.exchangeCodeForTokens(session, request);

   // Create user session data
   const user: UserData = {
      uniqueId: authResult.uniqueId,
      displayName: authResult.account?.name || '',
      email: authResult.account?.username || '',
      roles: [],
   };

   session.set('user', user);

   return redirectDocument(redirectTo);
}

/**
 * Ensures user is authenticated, redirecting to login if needed
 * @param session - User's session to check for authentication state
 * @param request - Request to use as return URL after authentication
 * @returns User data if authenticated
 * @throws Redirect to login page if not authenticated
 */
export async function ensureUserAuthenticated(session: Session, request: Request): Promise<UserData> {
   let user = session.find<UserData>('user');
   if (!user) {
      throw redirectToLogin(request);
   }
   return user;
}

/**
 * Processes user logout by clearing session and redirecting to identity provider logout
 * @param session - User's session to clear
 * @param request - Request containing return URL
 * @returns Redirect to identity provider's logout page
 */
export async function processUserLogout(session: Session, request: Request) {
   const { searchParams } = new URL(request.url);
   const returnUrl = searchParams.get('returnUrl') ?? '/';

   // Get logout URL before clearing session
   const logoutUrl = await authProvider.logout(session, request, returnUrl);

   // Clear additional session data (user data, API tokens, etc)
   session.unset('user');
   await session.destroy();

   return redirectDocument(logoutUrl);
}

/**
 * Ensures user is authenticated with valid API access (JWT)
 * @param session - User's session to check for authentication and API token
 * @param request - Request to use as return URL after authentication
 * @returns User data with valid API token
 * @throws {Error} If JWT verification fails or API token not found
 * @throws Redirect to login page if authentication needed
 */
export async function ensureUserHasApiAccess(session: Session, request: Request): Promise<UserData> {
   const user = await ensureUserAuthenticated(session, request);
   // Check if backend JWT is about to expire
   if (
      !user.apiToken ||
      (user.apiToken && user.apiTokenExpiresAt && user.apiTokenExpiresAt - Date.now() < 5 * 60 * 1000)
   ) {
      // Call the backend auth endpoint to get a new JWT

      // First ensure our entra id token is still valid
      const { authResult } = await authProvider.refreshAccessToken(session);
      if (!authResult) {
         throw redirectToLogin(request);
      }

      const response = await fetch(`${process.env.BACKEND_API_URL}/auth/enrich-token`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authResult.accessToken}`,
         },
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(
            `Backend authentication failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`,
         );
      }
      const data = await response.json();

      // Verify the token structure
      const encoder = new TextEncoder();
      const secret = encoder.encode(process.env.JWT_VERIFICATION_KEY);
      const { payload } = await jwtVerify(data.token, secret, {
         algorithms: ['HS256'],
      });

      // Extract roles from claims
      const roles: string[] = [];
      const payloadObj = { ...payload };

      // Handle both string and array role claims
      if (payloadObj.role) {
         if (typeof payloadObj.role === 'string') {
            roles.push(payloadObj.role);
         } else if (Array.isArray(payloadObj.role)) {
            roles.push(...payloadObj.role.map((v) => v.toString()));
         }
      }

      // Update user session with new token and roles
      user.apiToken = data.token;
      user.apiTokenExpiresAt = (payload.exp as number) * 1000; // Convert to milliseconds
      user.roles = roles;
      session.set('user', user);
   }

   if (!user.apiToken) {
      throw new Error('API token not found after authentication');
   }

   return user;
}

/**
 * Checks if the user has a specific authorization role
 * @param userData - User data containing roles array
 * @param requiredRole - Role to check for
 * @returns True if user has the required role, false otherwise
 *
 * Safely handles missing roles array or undefined user data
 */
export function hasAuthorizationRole(userData: UserData, requiredRole: string): boolean {
   try {
      return Boolean(userData?.roles?.includes(requiredRole));
   } catch (error) {
      return false;
   }
}

function redirectToLogin(request: Request) {
   const url = new URL(request.url);
   const returnUrl = encodeURIComponent(url.pathname + url.search);
   return redirectDocument(`/auth/login?returnUrl=${returnUrl}`);
}
