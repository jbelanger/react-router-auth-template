import type { Route } from "./+types/_index";
import { useLoaderData, Link } from "react-router";

export async function loader({ context, request }: Route.LoaderArgs) {
  return {
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Remix Auth Demo</h1>

      <div className="space-y-6">
        <p>You are not logged in.</p>
        <Link
          to="/protected"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
