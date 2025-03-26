import { getI18nRouteHelper, i18nRoute } from "@gc-fwcs/i18n";
import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

const i18nRoutes = [
    index("routes/_index.tsx"),
    route("auth/*", "routes/auth/$.tsx"),
    route("api/protected-data", "routes/protected/api.protected-data.ts"),
    layout("routes/protected/_layout.tsx", [
        ...i18nRoute("protected", "protege", "routes/protected/_index.tsx"),
        ...i18nRoute("protected/backend", "protege/backend", "routes/protected/_protected.protected.tsx"),
    ])];

export const i18nHelper = getI18nRouteHelper(i18nRoutes);

export default i18nRoutes satisfies RouteConfig;
