import type { i18n, InitOptions } from "i18next";
import { createInstance } from "i18next";
import Backend from "i18next-fs-backend";
import { resolve } from "node:path";
import { initReactI18next } from "react-i18next";
import type { EntryContext } from "react-router";
import { RemixI18Next } from "remix-i18next/server";
import { getLanguage } from "@gc-fwcs/i18n";
import { RouteConfigEntry } from "@react-router/dev/routes";
import {i18nDefaults} from "./i18n.ts";
import { getLogger } from "@gc-fwcs/logger";

interface I18nConfig {
  debug?: boolean;
  resources?: Record<string, Record<string, any>>;
}

const backendConfig = {
  loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
};

/**
 * Creates an i18n server instance with the provided configuration
 */
export async function createI18nServer(
  request: Request,
  remixContext: EntryContext,
  routes: RouteConfigEntry[],
  config: Partial<I18nConfig> = {}
): Promise<i18n> {
  const mergedConfig: InitOptions = {
    ...i18nDefaults,
    defaultNS: false,
    ...config,
  };
  const log = getLogger("i18n");

  const i18next = new RemixI18Next({
    detection: {
      supportedLanguages: i18nDefaults.supportedLngs,
      fallbackLanguage: i18nDefaults.fallbackLng,
      findLocale: (request) => getLanguage(request, routes),
    },
    i18next: {
      ...mergedConfig,
      backend: backendConfig,
    },
    plugins: [Backend],
  });

  const instance = createInstance();
  const lng = await i18next.getLocale(request);
  const ns = i18next.getRouteNamespaces(remixContext);
  
  // Validate that all required namespaces are included in server-side resources
  if (config.resources) {
    const availableNamespaces = new Set<string>();
    Object.values(config.resources).forEach(langResources => {
      Object.keys(langResources).forEach(ns => availableNamespaces.add(ns));
    });
    
    const missingNamespaces = ns.filter(n => !availableNamespaces.has(n));
    if (missingNamespaces.length > 0) {
      log.error(`[i18n] Server-side rendering error: Missing required namespaces in resources configuration`);
      log.error(`[i18n] This will cause hydration errors as server rendering won't match client rendering`);
      log.error(`[i18n] Missing namespaces: ${missingNamespaces.join(', ')}`);
      log.error(`[i18n] Available namespaces: ${Array.from(availableNamespaces).join(', ')}`);
      log.error(`[i18n] Fix: Add these namespaces to the resources in entry.server.tsx`);
    }
  } else {
    log.warn(`[i18n] No resources provided for server-side rendering. This may cause hydration issues.`);
  }
  
  await instance
    .use(initReactI18next)
    .use(Backend)
    .init({
      ...mergedConfig,
      lng,
      ns,
      backend: backendConfig,
    });

  return instance;
}
