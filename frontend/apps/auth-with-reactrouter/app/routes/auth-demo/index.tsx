import { Link, useLoaderData } from 'react-router';

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

export default function AuthDemo() {
   const { isAuthenticated, user } = useLoaderData() as {
      isAuthenticated: boolean;
      user: { displayName: string; email: string } | null;
   };

   return (
      <div className="p-8">
         <h1 className="mb-6 text-3xl font-bold">Auth Module Demo</h1>

         {isAuthenticated ? (
            <div className="space-y-6">
               <div className="rounded border border-green-700 bg-green-900/30 p-4 text-green-100">
                  <p className="font-bold">You are logged in!</p>
                  <p>Welcome, {user?.displayName || 'User'}</p>
                  <p>Email: {user?.email}</p>
               </div>

               <div className="flex flex-wrap gap-4">
                  <Link to="/auth/logout" className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                     Sign Out
                  </Link>
                  <Link
                     to="/auth-demo/api-access"
                     className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
                     API Access Demo
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
