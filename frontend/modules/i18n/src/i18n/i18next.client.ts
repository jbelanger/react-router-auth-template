import type { i18n, InitOptions, LanguageDetectorModule } from "i18next";
import { createInstance } from "i18next";
import I18NextHttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { getInitialNamespaces } from "remix-i18next/client";
import {i18nDefaults} from "./i18n.ts";

interface I18nClientConfig {
  debug?: boolean;
}

const languageDetector: LanguageDetectorModule = {
  type: "languageDetector",
  detect: () => document?.documentElement?.lang ?? "en",
  init: () => {},
  cacheUserLanguage: () => {},
};

/**
 * Creates an i18n client instance with the provided configuration
 * @param config - Custom i18n configuration (optional)
 * @returns Configured i18n instance
 */
export async function createI18nClient(
  config: Partial<I18nClientConfig> = {}
): Promise<i18n> {
  const mergedConfig: InitOptions = {
    ...i18nDefaults,
    defaultNS: false,
    ...config,
  };

  const instance = createInstance();
  const ns = getInitialNamespaces();
  console.log("Client namespaces: " + ns);
  await instance
    .use(initReactI18next)
    .use(languageDetector)
    .use(I18NextHttpBackend)
    .init({
      ...mergedConfig,
      ns,
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json'
      }
    });

  return instance;
}