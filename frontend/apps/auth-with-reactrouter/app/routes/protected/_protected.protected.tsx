import { useEffect, useState } from 'react';

import { useCurrentLanguage } from '@gc-fwcs/i18n/routing';
import { useTranslation } from 'react-i18next';
import { useLoaderData } from 'react-router';

import { ensureUserHasApiAccess, hasAuthorizationRole } from '../../utils/auth.utils.server';
import type { Route } from './+types/_protected.protected';

export async function loader({ context, request }: Route.LoaderArgs) {
   try {
      // This will ensure we have both authentication and a valid API token
      const user = await ensureUserHasApiAccess(context.session, request);
      const hasAdminAccess = hasAuthorizationRole(user, 'admin');

      return {
         user: {
            displayName: user.displayName,
            email: user.email,
         },
         hasAdminAccess,
      };
   } catch (error) {
      // Handle auth errors (redirects to login if needed)
      throw error;
   }
}

export default function ProtectedPage() {
   const { user, hasAdminAccess } = useLoaderData<typeof loader>();
   const [apiData, setApiData] = useState<unknown>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const currLang = useCurrentLanguage();
   const { t } = useTranslation();

   // This function simulates calling an API using the enriched token
   useEffect(() => {
      // Only fetch if user has data access permission
      if (!hasAdminAccess) return;

      async function fetchApiData() {
         setLoading(true);
         setError(null);

         try {
            const response = await fetch('/api/protected-data');

            if (!response.ok) {
               throw new Error('API request failed');
            }

            const data = await response.json();
            setApiData(data);
         } catch (err) {
            setError('Failed to fetch data from API');
            console.error(err);
         } finally {
            setLoading(false);
         }
      }

      fetchApiData();
   }, [hasAdminAccess]);

   return (
      <div className="p-8">
         <h1 className="mb-6 text-3xl font-bold">{t('Protected Content')}</h1>

         <div className="mb-6 rounded border border-green-700 bg-green-900/30 p-4 text-green-100">
            <p className="font-bold">User Details</p>
            <p>Name: {user.displayName}</p>
            <p>Email: {user.email}</p>
         </div>

         {hasAdminAccess ? (
            <div className="mb-6 rounded border border-purple-700 bg-purple-900/30 p-4 text-purple-100">
               <p className="font-bold">Admin Access Granted</p>
               <p>You have admin privileges!</p>
            </div>
         ) : (
            <div className="mb-6 rounded border border-yellow-700 bg-yellow-900/30 p-4 text-yellow-100">
               <p className="font-bold">Regular User Access</p>
               <p>You don&apos;t have admin privileges.</p>
            </div>
         )}

         {hasAdminAccess ? (
            <div className="rounded border border-gray-700 bg-gray-800 p-4">
               <h2 className="mb-2 font-bold">API Data:</h2>

               {loading ? (
                  <p>Loading data...</p>
               ) : error ? (
                  <p className="text-red-400">{error}</p>
               ) : apiData ? (
                  <pre className="overflow-x-auto rounded bg-gray-900 p-2 text-gray-300">
                     {JSON.stringify(apiData, null, 2)}
                  </pre>
               ) : (
                  <p>No data available</p>
               )}
            </div>
         ) : (
            <div className="rounded border border-red-700 bg-red-900/30 p-4 text-red-100">
               <p className="font-bold">Access Denied</p>
               <p>You don&apos;t have permission to view the API data.</p>
            </div>
         )}
      </div>
   );
}
