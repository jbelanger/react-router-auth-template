import { createContext, useContext, ReactNode } from 'react';
import { useMatches } from 'react-router';
import type { RouteHandleData } from './types.ts';
import { route, RouteConfigEntry } from '@react-router/dev/routes';

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
 * Hook to find a route by its ID. For server-side route lookup,
 * import findRouteById from routes.server.ts instead.
 */
export function useRouteById(id: string): RouteConfigEntry | undefined {
  const routes = useContext(RoutesContext);
  return findRouteById(routes, id);
}

/**
 * Hook to get all i18n namespaces from the current route matches
 */
export function useI18nNamespaces(): string[] {
  const matches = useMatches();
  const namespaces = matches
    .map(match => (match.handle as RouteHandleData | undefined)?.i18nNamespaces || [])
    .flat();
  return [...new Set(namespaces)];
}

/**
 * Find a route by its ID. This is used server-side in loaders and actions.
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
 * Creates route configurations for both English and French versions of a route
 */
export function i18nRoute(enPath: string, frPath: string, file: string, children?: RouteConfigEntry[]): RouteConfigEntry[] {
    // Ensure paths start with "/"
    const normalizedEnPath = enPath.startsWith('/') ? enPath : `/${enPath}`;
    const normalizedFrPath = frPath.startsWith('/') ? frPath : `/${frPath}`;
  
    return [
      route(normalizedEnPath, file, { id: `${normalizedEnPath}-en` }, children),
      route(normalizedFrPath, file, { id: `${normalizedEnPath}-fr` }, children)
    ];
  }