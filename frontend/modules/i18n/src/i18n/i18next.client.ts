import type { i18n, InitOptions, LanguageDetectorModule } from "i18next";
import { createInstance } from "i18next";
import I18NextHttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { getInitialNamespaces } from "remix-i18next/client";
import {addDefaultNamespaces, I18nConfig, i18nDefaults} from "./i18n.ts";
import LanguageDetector from "i18next-browser-languagedetector";

/**
 * Creates an i18n client instance with the provided configuration
 * @param config - Custom i18n configuration (optional)
 * @returns Configured i18n instance
 */
export async function createI18nClient(
  config: Partial<I18nConfig> = {}
): Promise<i18n> {
  const mergedConfig: InitOptions = {
    ...i18nDefaults,
    ...config,
  };
const instance = createInstance();
let ns = getInitialNamespaces();
ns = addDefaultNamespaces(ns, mergedConfig.defaultNS);

await instance
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(I18NextHttpBackend)
    .init({
      ...mergedConfig,
      ns,
      backend: {
        loadPath: '/locales/{{lng}}/{{ns}}.json'
      },
      detection: {
        // Here only enable htmlTag detection, we'll detect the language only
        // server-side with remix-i18next, by using the `<html lang>` attribute
        // we can communicate to the client the language detected server-side
        order: ["htmlTag"],
        // Because we only use htmlTag, there's no reason to cache the language
        // on the browser, so we disable it
        caches: [],
      },
    });

  return instance;
}