//
// XXX :: GjB :: the contents of this file should probably live in app/routes.ts,
//               but can't because of https://github.com/remix-run/remix/issues/10227
//
//               to work around that issue the i18n routes are moved to a separate
//               file that doesn't import '@remix-run/route-config'
//
// note: because the routes are processed at build time by vite,
//       we cannot use aliased imports (ie: ~/) here

// export type Language = 'en' | 'fr';
// export type I18nRoute = I18nLayoutRoute | I18nPageRoute;
// export type I18nLayoutRoute = { file: string; children: I18nRoute[] };
// export type I18nPageRoute = { file: string; id: string; paths: I18nPaths };
// export type I18nRouteId = ExtractI18nRouteIds<(typeof i18nRoutes)[number]>;
// export type I18nPaths = Record<Language, string>;

// type ExtractI18nRouteId<T> = T extends I18nPageRoute ? T['id'] : never;
// type ExtractI18nRouteIds<T, Filter = void> = T extends I18nLayoutRoute //
//   ? ExtractI18nRouteIds<T['children'][number], Filter>
//   : ExtractI18nRouteId<T>;
