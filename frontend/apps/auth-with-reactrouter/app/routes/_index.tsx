import { Link, useLoaderData } from 'react-router';

import type { Route } from './+types/_index';

export async function loader({ context, request }: Route.LoaderArgs) {
   return {};
}

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
   return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
}

export default function Index() {
   return (
      <div className="p-8">
         <h1 className="mb-6 text-3xl font-bold">Remix Auth Demo</h1>

         <div className="space-y-6">
            <p>You are not logged in.</p>
            <Link to="/protected" className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
               Sign In
            </Link>
         </div>
      </div>
   );
}
