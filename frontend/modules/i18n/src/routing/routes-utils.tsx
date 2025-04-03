import { createContext, useContext, ReactNode } from 'react';
import { route, RouteConfigEntry } from '@react-router/dev/routes';
import { useLocation } from 'react-router';
import { AppLocale } from './index.ts';

export type ExtendedRouteConfigEntry = RouteConfigEntry & {
  lang: AppLocale;
};

const RoutesContext = createContext<RouteConfigEntry[]>([]);


export function I18nRoutesProvider({
  routes,
  children
}: {
  routes: RouteConfigEntry[];
  children: ReactNode;
}) {
  return (
    <RoutesContext.Provider value={routes}>
      {children}
    </RoutesContext.Provider>
  );
}

/**
 * Returns the alternate language for the given input language.
 * (ie: 'en' → 'fr'; 'fr' → 'en')
 */
export function getAltLanguage(language: string): AppLocale {
  switch (language) {
    case 'en':
      return 'fr';
    case 'fr':
      return 'en';
    default:
      throw new Error(`Could not determine altLanguage for language: ${language}.`);
  }
}

/**
 * Extracts the language from a route based on the given resource path.
 *
 * @param resource - The resource from which to extract the pathname (Request, URL, or string path)
 * @param routes - Array of route configurations to search through
 * @param fallback - Whether to fallback to 'en' (false) or throw an error (true) when no route is found
 * @returns The detected language as AppLocale ('en' | 'fr')
 * @throws {Error} When no route is found and fallback is true
 */
export function getRouteLanguage(resource: Request | URL | string, routes: RouteConfigEntry[], fallback: boolean = true): AppLocale {
  const pathname = resource instanceof Request ? new URL(resource.url).pathname :
                  resource instanceof URL ? resource.pathname :
                  resource;
  
  const route = findRouteByPathname(routes, pathname);
  if (route) {
    return (route as ExtendedRouteConfigEntry).lang;
  }
  
  console.error(`No route found for pathname: ${pathname}`);
  if (!fallback) {
    throw new Error(`No route found for pathname: ${pathname}`);
  }

  return 'en';
}

/**
 * A hook that returns the current language from the route.
 *
 * @returns The current language as AppLocale ('en' | 'fr')
 * @throws {Error} When no route is found
 */
export function useCurrentLanguage(): AppLocale {
  const { pathname } = useLocation();
  const routes = useRoutes();
  return getRouteLanguage(pathname, routes, false);
}

/**
 * Hook to find a route by its ID. For server-side route lookup,
 * import findRouteById from routes.server.ts instead.
 */
export function useRoutes(): RouteConfigEntry[] {
  return useContext(RoutesContext);
}

/**
 * Hook to find a route by its ID. For server-side route lookup,
 * import findRouteById from routes.server.ts instead.
 */
export function useRouteById(id: string): RouteConfigEntry | undefined {
  const routes = useRoutes();
  return findRouteById(routes, id);
}

/**
 * Find a route by its ID. This can be used server-side in loaders and actions.
 * For client-side route lookup, use the useRouteById hook instead.
 */
export function findRouteById(routes: RouteConfigEntry[], id: string): RouteConfigEntry | undefined {
  for (const route of routes) {
    if (route.id === id) return route;
    if (route.children?.length) {
      const found = findRouteById(route.children, id);
      if (found) return found;
    }
  }
}

/**
 * Find a route by its PathName. This can be used server-side in loaders and actions.
 * For client-side route lookup, use the useRouteById hook instead.
 */
export function findRouteByPathname(routes: RouteConfigEntry[], pathname: string): RouteConfigEntry | undefined {
  for (const route of routes) {
    if (route.path === pathname) return route;
    if (route.children?.length) {
      const found = findRouteByPathname(route.children, pathname);
      if (found) return found;
    }
  }
}

/**
 * Creates route configurations for both English and French versions of a route
 */
export function i18nRoute(enPath: string, frPath: string, file: string, children?: RouteConfigEntry[]): ExtendedRouteConfigEntry[] {

      // Ensure paths start with "/"
      const normalizedEnPath = enPath.startsWith('/') ? enPath : `/${enPath}`;
      const normalizedFrPath = frPath.startsWith('/') ? frPath : `/${frPath}`;

    return [
      { ...route(normalizedEnPath, file, { id: `${normalizedEnPath}-en` }, children), lang: 'en' },
      // The id of the french route has the same id as the english route, but with "-fr" suffix
      // This is to allow the i18n links to find the proper route based on the english link.
      // The i18nlink should always have the "to" prop set to the english route id.
      { ...route(normalizedFrPath, file, { id: `${normalizedEnPath}-fr` }, children), lang: 'fr' }
    ] as ExtendedRouteConfigEntry[];
  }
