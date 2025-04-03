import { createContext, useContext, ReactNode } from 'react';
import { route, RouteConfigEntry } from '@react-router/dev/routes';
import { useLocation } from 'react-router';
import { AppLocale } from './index.ts';

export type ExtendedRouteConfigEntry = RouteConfigEntry & {
  lang: AppLocale;
};

const RoutesContext = createContext<RouteConfigEntry[]>([]);


/**
 * A context provider that makes route configurations available throughout the application.
 * Required for i18n routing functionality to work properly.
 *
 * @param routes - Array of route configurations to provide
 * @param children - Child components that need access to routes
 */
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
 * @param fallback - Whether to fallback to 'en' (true) or throw an error (false) when no route is found
 * @returns The detected language as AppLocale ('en' | 'fr')
 * @throws {Error} When no route is found and fallback is false
 */
export function getRouteLanguage(resource: Request | URL | string, routes: RouteConfigEntry[], fallback: boolean = true): AppLocale {
  const pathname = resource instanceof Request ? new URL(resource.url).pathname :
                  resource instanceof URL ? resource.pathname :
                  resource;
  
  const route = findRoute(routes, 'path', pathname);
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
 * Hook to access the full routes configuration.
 * Used internally by other hooks, but can also be used directly if needed.
 *
 * @returns Array of all route configurations
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
  return findRoute(routes, 'id', id);
}


/**
 * Creates route configurations for both English and French versions of a route
 *
 * @param enPath - The path for the English version of the route
 * @param frPath - The path for the French version of the route
 * @param file - The file containing the route component
 * @param children - Optional child routes
 * @returns Array containing both language versions of the route with appropriate IDs
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

/**
 * Find a route by its ID or pathname. This can be used server-side in loaders and actions.
 * For client-side route lookup, use the useRouteById hook instead.
 */
function findRoute<T extends keyof RouteConfigEntry>(
  routes: RouteConfigEntry[],
  key: T,
  value: RouteConfigEntry[T]
): RouteConfigEntry | undefined {
  for (const route of routes) {
    if (route[key] === value) return route;
    if (route.children?.length) {
      const found = findRoute(route.children, key, value);
      if (found) return found;
    }
  }
}