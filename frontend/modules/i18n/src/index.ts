import { FlatNamespace } from "i18next";
import { z } from 'zod';
import validator from 'validator';
import { useMatches } from 'react-router';
import { type RouteConfigEntry, index, layout, route } from "@react-router/dev/routes";

export type Language = 'en' | 'fr';
export type I18nRoute = I18nLayoutRoute | I18nPageRoute;
export type I18nLayoutRoute = { file: string; children: I18nRoute[] };
export type I18nPageRoute = { file: string; id: string; paths: I18nPaths };
export type I18nPaths = Record<Language, string>;

export const i18nNamespacesSchema = z
  .array(z.custom<FlatNamespace>())
  .refine((arr) => Array.isArray(arr) && arr.every((val) => typeof val === 'string' && !validator.isEmpty(val)))
  .readonly();
export type I18nNamespaces = z.infer<typeof i18nNamespacesSchema>;
/**
 * Common data returned from a route's handle object.
 */
export interface RouteHandleData extends Record<string, unknown | undefined> {
  i18nNamespaces?: I18nNamespaces;
}

    /**
     * Generates a route id by combining a base id and a language code.
     * This is necessary because React Router route ids must be unique.
     *
     * @param id - The base route id.
     * @param language - The language code.
     * @returns The generated route id.
     */
      function generateRouteId(id: string, language: string): string {
        return `${id}-${language}`;
      }

export function i18nRoute(enPath: string, frPath: string, file: string, children?: RouteConfigEntry[]): RouteConfigEntry[] {
    return [ 
        route(enPath, file, {id: generateRouteId(enPath, 'en')}, children), 
        route(frPath, file, {id: generateRouteId(enPath, 'fr')}, children)
    ];
}

export const getI18nRouteHelper = (routes: RouteConfigEntry[]) => {
    const i18nRoutes = routes;

    return {
        findRouteById(id: string, routes: RouteConfigEntry[] = i18nRoutes): I18nPageRoute | undefined {
            for (const route of routes) {
            if (isI18nPageRoute(route) && route.id === id) {
                return route;
            }
        
            if (isI18nLayoutRoute(route)) {
                const matchingRoute = this.findRouteById(id, route.children);
                if (matchingRoute) return matchingRoute;
            }
            }
        },
        useI18nNamespaces() {
            const namespaces = useMatches()
              .map(({ handle }) => handle as RouteHandleData | undefined)
              .map((handle) => i18nNamespacesSchema.safeParse(handle?.i18nNamespaces))
              .flatMap((result) => (result.success ? result.data : undefined))
              .filter((i18nNamespaces) => i18nNamespaces !== undefined);
            return [...new Set(namespaces)];
          }
    }

      /**
       * Type guard to determine if a route is an I18nLayoutRoute.
       */
      function isI18nLayoutRoute(obj: unknown): obj is I18nLayoutRoute {
        return obj !== null && typeof obj === 'object' && 'file' in obj && 'children' in obj;
      }
      
      /**
       * Type guard to determine if a route is an I18nPageRoute.
       */
      function isI18nPageRoute(obj: unknown): obj is I18nPageRoute {
        return obj !== null && typeof obj === 'object' && 'file' in obj && 'id' in obj && 'paths' in obj;
      }
};