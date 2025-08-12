import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

import { i18nRoute } from '@gc-fwcs/i18n/routing';

const i18nRoutes = [
   index('routes/_index.tsx'),
   route('auth/*', 'routes/auth/$.tsx'),
   route('auth-demo/api/protected-data', 'routes/auth-demo/api.protected-data.ts'),
   layout('routes/auth-demo/_layout.tsx', [
      route('auth-demo', 'routes/auth-demo/index.tsx'),
      route('auth-demo/api-access', 'routes/auth-demo/api-access.protected.tsx'),
   ]),
   layout('routes/i18n-demo/_layout.tsx', [
      ...i18nRoute('i18n-demo', 'demo-i18n', 'routes/i18n-demo/index.tsx'),
      ...i18nRoute('i18n-demo/item/:id', 'demo-i18n/item/:id', 'routes/i18n-demo/item.$id.tsx'),
   ]),
   route('logger-demo', 'routes/logger-demo/index.tsx'),
   route('session-demo', 'routes/session-demo/index.tsx'),
   route('express-demo', 'routes/express-demo/index.tsx'),
   route('helpers-demo', 'routes/helpers-demo/index.tsx'),
];

export default i18nRoutes satisfies RouteConfig;
