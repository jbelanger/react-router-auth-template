import { useMatches } from 'react-router';
import type { RouteConfigEntry } from "@react-router/dev/routes";
import type { I18nRoute, I18nLayoutRoute, I18nPageRoute, RouteHandleData } from "./index.ts";
import { i18nNamespacesSchema } from "./index.ts";

/**
 * Registry to store and manage i18n routes across the application
 */
class I18nRouteRegistry {
    private static instance: I18nRouteRegistry;
    private routes: RouteConfigEntry[] = [];

    private constructor() {}

    static getInstance(): I18nRouteRegistry {
        if (!I18nRouteRegistry.instance) {
            I18nRouteRegistry.instance = new I18nRouteRegistry();
        }
        return I18nRouteRegistry.instance;
    }

    setRoutes(routes: RouteConfigEntry[]): void {
        this.routes = routes;
    }

    getRoutes(): RouteConfigEntry[] {
        return this.routes;
    }

    findRouteById(id: string, routesToSearch: RouteConfigEntry[] = this.routes): RouteConfigEntry | undefined {
        for (const route of routesToSearch) {
            // Check if this route matches the ID
            if (route.id === id) {
                return route;
            }
        
            // If it's a layout route (has children), search through its children
            if (route.children?.length) {
                const found = this.findRouteById(id, route.children);
                if (found) return found;
            }
        }
    }

    useI18nNamespaces(): string[] {
        const namespaces = useMatches()
            .map(({ handle }) => handle as RouteHandleData | undefined)
            .map((handle) => i18nNamespacesSchema.safeParse(handle?.i18nNamespaces))
            .flatMap((result) => (result.success ? result.data : undefined))
            .filter((i18nNamespaces) => i18nNamespaces !== undefined);
        return [...new Set(namespaces)];
    }
}

export const routeRegistry = I18nRouteRegistry.getInstance();