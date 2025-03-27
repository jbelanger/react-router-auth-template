import { z } from 'zod';
import validator from 'validator';
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { route } from "@react-router/dev/routes";
import type { FlatNamespace } from "i18next";
import { routeRegistry as registry } from './route-registry.ts';

// Type definitions
export type Language = 'en' | 'fr';
export type I18nRoute = I18nLayoutRoute | I18nPageRoute;
export type I18nLayoutRoute = { file: string; children: I18nRoute[] };
export type I18nPageRoute = { file: string; id: string; paths: I18nPaths };
export type I18nPaths = Record<Language, string>;

export interface RouteHandleData extends Record<string, unknown | undefined> {
  i18nNamespaces?: FlatNamespace[];
}

// Schema for i18n namespaces validation
export const i18nNamespacesSchema = z
  .array(z.custom<FlatNamespace>())
  .refine((arr) => Array.isArray(arr) && arr.every((val) => typeof val === 'string' && !validator.isEmpty(val)))
  .readonly();

// Re-export route registry and context
export { routeRegistry } from './route-registry.ts';
export { I18nRoutesProvider, useI18nRoutes } from './components/routes-context.tsx';
export { I18nLink } from './components/i18n-link.tsx';


/**
 * Creates route configurations for both English and French versions of a route
 */
export function i18nRoute(enPath: string, frPath: string, file: string, children?: RouteConfigEntry[]): RouteConfigEntry[] {
  return [
    route(enPath, file, { id: `${enPath}-en` }, children),
    route(frPath, file, { id: `${enPath}-fr` }, children)
  ];
}

/**
 * Initializes the i18n routes in the registry
 */
export function initializeI18nRoutes(routes: RouteConfigEntry[]): void {
  registry.setRoutes(routes);
}