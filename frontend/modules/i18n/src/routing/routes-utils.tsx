import { ReactNode, createContext, useContext } from 'react';

import { RouteConfigEntry, route } from '@react-router/dev/routes';

import { matchRoutes, useLocation } from 'react-router';

import { AppLocale } from '../types.ts';

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
export function I18nRoutesProvider({ routes, children }: { routes: RouteConfigEntry[]; children: ReactNode }) {
   return <RoutesContext.Provider value={routes}>{children}</RoutesContext.Provider>;
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
export function getRouteLanguage(
   resource: Request | URL | string,
   routes: RouteConfigEntry[],
   fallback: boolean = true,
): AppLocale {
   const pathname =
      resource instanceof Request
         ? new URL(resource.url).pathname
         : resource instanceof URL
           ? resource.pathname
           : resource;

   const route = findRouteByPath(routes, pathname);
   if (route) {
      if (!isExtendedRoute(route)) {
         console.error(`Route found for "${pathname}" but it lacks language information`);
         return fallback
            ? 'en'
            : (() => {
                 throw new Error(`Route found for "${pathname}" but it lacks language information`);
              })();
      }
      return route.lang;
   }

   console.error(`No route found for pathname: ${pathname}`);
   if (!fallback) {
      throw new Error(`No route found for pathname: ${pathname}`);
   }

   return 'en';
}

/**
 * Hook to get the current route configuration based on the current pathname.
 *
 * @returns The current route configuration or undefined if no matching route is found
 * @see findRoute for the underlying route matching logic
 */
export function useCurrentRoute(): RouteConfigEntry | undefined {
   const { pathname } = useLocation();
   const routes = useRoutes();
   return findRouteByPath(routes, pathname);
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
   return getRouteLanguage(pathname, routes, true);
}

/**
 * Hook to access the full routes configuration.
 * Used internally by other hooks, but can also be used directly if needed.
 *
 * @returns Array of all route configurations
 */
export function useRoutes(): RouteConfigEntry[] {
   const routes = useContext(RoutesContext);
   if (!routes || routes.length === 0) {
      throw new Error(
         'useRoutes must be used within an I18nRoutesProvider. ' +
            'Please wrap your application with I18nRoutesProvider and provide your routes.',
      );
   }
   return routes;
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
 * Creates route configurations for both English and French versions of a route
 *
 * @param enPath - The path for the English version of the route
 * @param frPath - The path for the French version of the route
 * @param file - The file containing the route component
 * @param children - Optional child routes
 * @returns Array containing both language versions of the route with appropriate IDs
 */
export function i18nRoute(
   enPath: string,
   frPath: string,
   file: string,
   children?: RouteConfigEntry[],
): ExtendedRouteConfigEntry[] {
   // Ensure paths start with "/"
   const normalizedEnPath = enPath.startsWith('/') ? enPath : `/${enPath}`;
   const normalizedFrPath = frPath.startsWith('/') ? frPath : `/${frPath}`;

   return [
      { ...route(normalizedEnPath, file, { id: `${normalizedEnPath}-en` }, children), lang: 'en' },
      // The id of the french route has the same id as the english route, but with "-fr" suffix
      // This is to allow the i18n links to find the proper route based on the english link.
      // The i18nlink should always have the "to" prop set to the english route id.
      { ...route(normalizedFrPath, file, { id: `${normalizedEnPath}-fr` }, children), lang: 'fr' },
   ] as ExtendedRouteConfigEntry[];
}

/**
 * Find a route by its pathname. This can be used server-side in loaders and actions.
 * Supports route parameters (e.g., '/products/:id' matches '/products/1').
 *
 * @param routes - Array of route configurations to search through
 * @param pathname - The pathname to match against
 * @returns The matched route or undefined if no match found
 */
function findRouteByPath(routes: RouteConfigEntry[], pathname: string): RouteConfigEntry | undefined {
   const matches = matchRoutes(routes as { path: string }[], pathname);
   return matches?.[matches.length - 1]?.route as RouteConfigEntry | undefined;
}

/**
 * Find a route by its ID. This can be used server-side in loaders and actions.
 *
 * @param routes - Array of route configurations to search through
 * @param id - The route ID to find
 * @returns The matched route or undefined if no match found
 */
function findRouteById(routes: RouteConfigEntry[], id: string): RouteConfigEntry | undefined {
   for (const route of routes) {
      if (route.id === id) return route;

      if (route.children?.length) {
         const found = findRouteById(route.children, id);
         if (found) return found;
      }
   }
   return undefined;
}

/**
 * Type guard to check if a route has language information
 */
function isExtendedRoute(route: RouteConfigEntry): route is ExtendedRouteConfigEntry {
   return 'lang' in route;
}
