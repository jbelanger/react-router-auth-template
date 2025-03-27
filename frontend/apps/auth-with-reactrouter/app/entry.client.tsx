import { createInstance, type Namespace } from "i18next";
import I18NextHttpBackend from "i18next-http-backend";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { HydratedRouter } from "react-router/dom";
import { getServerEnv } from "./utils/env.utils";
import commonEn from '~/../public/locales/en/common.json';
import commonFr from '~/../public/locales/fr/common.json';
import type { i18n, LanguageDetectorModule } from 'i18next';

export async function initI18n(namespaces: Array<string>) {
const i18n = createInstance();
const { NODE_ENV } = getServerEnv(process.env);
const I18NEXT_DEBUG = true;//NODE_ENV !== 'production';
const languageDetector = {
  type: 'languageDetector',
  detect: () => document?.documentElement?.lang ?? "en",
} satisfies LanguageDetectorModule;

await i18n
  .use(initReactI18next)
  .use(languageDetector)
  .use(I18NextHttpBackend)
  .init({
    appendNamespaceToMissingKey: true,
    debug: I18NEXT_DEBUG,
    defaultNS: "common",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    // ns: namespaces,
    preload: ['en', 'fr'],
    supportedLngs: ["en", "fr"],
    resources: {    
        en: {
            common: commonEn,
        },
        fr: {
            common: commonFr,
        },
        },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
}

function hydrateDocument(i18n: i18n): void {
  hydrateRoot(
    document,
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <HydratedRouter />
      </I18nextProvider>
    </StrictMode>,
  );
}

startTransition(() => {
  const routeModules = Object.values(globalThis.__reactRouterRouteModules);
  const routes = routeModules.filter((routeModule) => routeModule !== undefined);
  void initI18n(['common']).then(hydrateDocument);
});
