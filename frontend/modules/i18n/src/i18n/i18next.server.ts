import type { DefaultNamespace, FlatNamespace, InitOptions, KeyPrefix, Namespace, i18n } from 'i18next';
import { createInstance } from 'i18next';
import Backend from 'i18next-fs-backend';
import { resolve } from 'node:path';
import { FallbackNs, initReactI18next } from 'react-i18next';
import type { EntryContext } from 'react-router';
import { RemixI18Next } from 'remix-i18next/server';

import { AppLocale } from '../routing/index.ts';
import { I18nConfig, addDefaultNamespaces, i18nDefaults } from './i18n.ts';

const backendConfig = {
   loadPath: resolve('./public/locales/{{lng}}/{{ns}}.json'),
};

export const createRemixI18Next = (lng: AppLocale) => {
   return new RemixI18Next({
      detection: {
         supportedLanguages: i18nDefaults.supportedLngs,
         fallbackLanguage: i18nDefaults.fallbackLng,
      },
      i18next: {
         ...i18nDefaults,
         lng,
         defaultNS: false,
         backend: backendConfig,
      },
      plugins: [Backend],
   });
};

/**
 * Creates an i18n server instance with the provided configuration
 */
export async function createI18nServer(
   routerContext: EntryContext,
   lng: AppLocale,
   config: Partial<I18nConfig> = {},
): Promise<i18n> {
   const mergedConfig: InitOptions = {
      ...i18nDefaults,
      ...config,
   };

   const i18next = createRemixI18Next(lng);
   const instance = createInstance();
   let ns = i18next.getRouteNamespaces(routerContext);
   ns = addDefaultNamespaces(ns, mergedConfig.defaultNS);

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

/**
 * Returns a t function that defaults to the language resolved through the request.
 * @see https://www.i18next.com/overview/api#getfixedt
 */
export async function getFixedT<
   N extends FlatNamespace | readonly [FlatNamespace, ...FlatNamespace[]] = DefaultNamespace,
   KPrefix extends KeyPrefix<FallbackNs<N>> = undefined,
>(locale: AppLocale, namespaces: N) {
   const i18next = createRemixI18Next(locale);
   return i18next.getFixedT(locale, namespaces);
}
