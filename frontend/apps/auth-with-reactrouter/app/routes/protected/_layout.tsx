import { Outlet, useLoaderData } from "react-router-dom";
import { Navigate } from "react-router-dom";
import type { UserData } from "../../../types";

import type { Route } from "./+types/_layout";
import { ensureUserAuthenticated } from "~/utils/auth.utils.server";

export async function loader({ request, context }: Route.LoaderArgs) {
    let user = context.session.find<UserData>('user');
    const user2 = await ensureUserAuthenticated(context.session, request);

    if (!user)
        return {};

    return {
        user,
    };
}

export default function ProtectedRoute() {
    const { user } = useLoaderData<typeof loader>();

    if (!user) {
        return <Navigate to="/auth/login" replace />;
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-gray-800 p-4">
                <div className="container mx-auto">
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-semibold">Protected Area</h1>
                        <div className="text-sm text-gray-300">
                            Welcome, {user?.displayName}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto">
                <Outlet />
            </main>
        </div>
    );
}