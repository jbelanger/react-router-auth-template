import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index("routes/_index.tsx"),
    route("auth/*", "routes/auth/$.tsx"),
    route("api/protected-data", "routes/protected/api.protected-data.ts"),
    layout("routes/protected/_layout.tsx", [
        route("protected", "routes/protected/_index.tsx"),
        route("protected/backend", "routes/protected/_protected.protected.tsx"),
    ]),
] satisfies RouteConfig;
