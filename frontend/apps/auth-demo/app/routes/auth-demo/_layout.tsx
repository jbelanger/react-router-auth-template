import { Outlet, useLoaderData } from 'react-router';

import { ensureUserAuthenticated } from '../../utils/auth.utils.server';

export async function loader({ context, request }: any) {
   const user = await ensureUserAuthenticated(context.session, request);
   return {
      isAuthenticated: !!user,
      user: user
         ? {
              displayName: user.displayName,
              email: user.email,
           }
         : null,
   };
}

export default function AuthDemoLayout() {
   const { isAuthenticated, user } = useLoaderData() as {
      isAuthenticated: boolean;
      user: { displayName: string; email: string } | null;
   };

   return (
      <div className="border-b border-gray-300 p-4">
         <div className="mb-4">
            <h2 className="text-xl font-semibold">Auth Demo Layout</h2>
            {isAuthenticated ? (
               <p className="text-green-700">
                  User: {user?.displayName} ({user?.email})
               </p>
            ) : (
               <p className="text-red-700">Not logged in</p>
            )}
         </div>
         <Outlet />
      </div>
   );
}
