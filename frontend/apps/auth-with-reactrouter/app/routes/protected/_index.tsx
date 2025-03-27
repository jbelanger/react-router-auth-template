import { I18nLink } from "@gc-fwcs/i18n/routing";
import type { Route } from "../+types/_index";
import { ensureUserAuthenticated } from "../../utils/auth.utils.server";
import { useLoaderData, Link } from "react-router";
import { useCurrentLanguage, getLanguage } from "@gc-fwcs/i18n";
import i18nRoutes from "~/routes";

export async function loader({ context, request }: Route.LoaderArgs) {
  const user = await ensureUserAuthenticated(context.session, request);

  const ll = getLanguage(request, i18nRoutes);
  if(!ll) {
    throw new Error("Could not determine language from request.");
  }
  else
  {
    console.log("Current language:", ll);
  }
  return {
    isAuthenticated: !!user,
    user: user ? {
      displayName: user.displayName,
      email: user.email,
    } : null,
    claims: {
      roles: user.roles ?? []
    }
  };
}

// eslint-disable-next-line no-empty-pattern
export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const { isAuthenticated, user, claims } = useLoaderData<typeof loader>();
  // const lang = useCurrentLanguage();
  // console.log("Current language:", lang.currentLanguage);
  

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Remix Auth Demo</h1>

      {isAuthenticated ? (
        <div className="space-y-6">
          <div className="bg-green-900/30 border border-green-700 text-green-100 p-4 rounded">
            <p className="font-bold">You are logged in!</p>
            <p>Welcome, {user?.displayName || "User"}</p>
            <p>Email: {user?.email}</p>
          </div>

          {claims && (
            <div className="bg-blue-900/30 border border-blue-700 text-blue-100 p-4 rounded">
              <h2 className="font-bold mb-2">Your Claims:</h2>

              <div className="mb-2">
                <h3 className="font-semibold">Roles:</h3>
                <ul className="list-disc pl-5">
                  {claims.roles?.length > 0 ? (
                    claims.roles.map((role, index) => (
                      <li key={index}>{role}</li>
                    ))
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
              lang="en"
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Protected Page
            </I18nLink>

            <Link
              to="/auth/logout"
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Sign Out
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <p>You are not logged in.</p>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
