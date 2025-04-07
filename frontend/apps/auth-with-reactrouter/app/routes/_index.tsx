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
         <h1 className="mb-8 text-4xl font-bold">Module Demos</h1>
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link to="/auth-demo" className="block rounded border border-gray-300 p-4 text-center hover:bg-gray-100">
               Auth Demo
            </Link>
            <Link to="/auth" className="block rounded border border-gray-300 p-4 text-center hover:bg-gray-100">
               Auth Routes
            </Link>
            <Link to="/i18n-demo" className="block rounded border border-gray-300 p-4 text-center hover:bg-gray-100">
               i18n Demo
            </Link>
            <Link to="/logger-demo" className="block rounded border border-gray-300 p-4 text-center hover:bg-gray-100">
               Logger Demo
            </Link>
            <Link to="/session-demo" className="block rounded border border-gray-300 p-4 text-center hover:bg-gray-100">
               Session Demo
            </Link>
            <Link to="/express-demo" className="block rounded border border-gray-300 p-4 text-center hover:bg-gray-100">
               Express Demo
            </Link>
            <Link to="/helpers-demo" className="block rounded border border-gray-300 p-4 text-center hover:bg-gray-100">
               Helpers Demo
            </Link>
            <Link to="/protected" className="block rounded border border-gray-300 p-4 text-center hover:bg-gray-100">
               Protected Area
            </Link>
         </div>
      </div>
   );
}
