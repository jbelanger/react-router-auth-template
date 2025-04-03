import { I18nLink, getRouteLanguage, useCurrentLanguage } from '@gc-fwcs/i18n/routing';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData } from 'react-router';

import type { Route } from '../+types/_index';
import { ensureUserAuthenticated } from '../../utils/auth.utils.server';
import i18nRoutes from '~/routes';

// export let handle = {
//   i18n: ["common"]
// };

export async function loader({ context, request }: Route.LoaderArgs) {
   const user = await ensureUserAuthenticated(context.session, request);

   const ll = getRouteLanguage(request, i18nRoutes);
   if (!ll) {
      throw new Error('Could not determine language from request.');
   } else {
      console.log('Current language:', ll);
   }
   return {
      isAuthenticated: !!user,
      user: user
         ? {
              displayName: user.displayName,
              email: user.email,
           }
         : null,
      claims: {
         roles: user.roles ?? [],
      },
   };
}

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
   return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
}

export default function Index() {
   const { isAuthenticated, user, claims } = useLoaderData<typeof loader>();
   const { t } = useTranslation('common');
   const currLang = useCurrentLanguage();

   return (
      <div className="p-8">
         <h1 className="mb-6 text-3xl font-bold">{t('Remix Auth2 Demo')}</h1>

         {isAuthenticated ? (
            <div className="space-y-6">
               <div className="rounded border border-green-700 bg-green-900/30 p-4 text-green-100">
                  <p className="font-bold">You are logged in!</p>
                  <p>Welcome, {user?.displayName || 'User'}</p>
                  <p>Email: {user?.email}</p>
               </div>

               {claims && (
                  <div className="rounded border border-blue-700 bg-blue-900/30 p-4 text-blue-100">
                     <h2 className="mb-2 font-bold">Your Claims:</h2>

                     <div className="mb-2">
                        <h3 className="font-semibold">Roles:</h3>
                        <ul className="list-disc pl-5">
                           {claims.roles?.length > 0 ? (
                              claims.roles.map((role, index) => <li key={index}>{role}</li>)
                           ) : (
                              <li>No roles assigned</li>
                           )}
                        </ul>
                     </div>
                  </div>
               )}

               <div className="space-x-4">
                  <I18nLink
                     to="/protected/backend"
                     lang={currLang}
                     className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
                     Protected Page
                  </I18nLink>

                  <Link to="/auth/logout" className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                     Sign Out
                  </Link>
               </div>
            </div>
         ) : (
            <div className="space-y-6">
               <p>You are not logged in.</p>
               <Link to="/login" className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  Sign In
               </Link>
            </div>
         )}
      </div>
   );
}
