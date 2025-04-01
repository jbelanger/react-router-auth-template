import type { FlatNamespace } from 'i18next';
import { useLocation } from 'react-router';
import { findRouteByPathname, ExtendedRouteConfigEntry, useRoutes } from './routing/routes-utils.tsx';
import { RouteConfigEntry } from '@react-router/dev/routes';


/**
 * A constant array representing the supported application locales.
 * `as const` ensures that the array is treated as a tuple of literal types `'en'` and `'fr'`.
 */
export const APP_LOCALES = ['en', 'fr'] as const;

/**
 * Checks if a given value is a valid application locale.
 *
 * @param value - The value to check, which can be of any type.
 * @returns `true` if the value is a valid `AppLocale`, otherwise `false`.
 *
 * @example
 * ```
 * isAppLocale('en'); // true
 * isAppLocale('fr'); // true
 * isAppLocale('es'); // false
 * isAppLocale(123);  // false
 * ```
 */
export function isAppLocale(value: unknown): value is AppLocale {
  if (typeof value !== 'string') return false;
  return APP_LOCALES.includes(value as AppLocale);
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
 * A hook that returns the current language and its alternate language.
 *
 * @returns An object containing the current language the alternate language.
 * @throws {Error} If no language can be detected for the current route.
 */ 
/**
 * A hook that returns the current language from the route.
 *
 * @returns The current language as AppLocale ('en' | 'fr')
 * @throws {Error} When no route is found
 */
export function useCurrentLanguage(): AppLocale {
  const { pathname } = useLocation();
  const routes = useRoutes();
  return getLanguage(pathname, routes, false);
}

/**
 * Extracts the language from a route based on the given resource path.
 *
 * @param resource - The resource from which to extract the pathname (Request, URL, or string path)
 * @param routes - Array of route configurations to search through
 * @param fallback - Whether to fallback to 'en' (false) or throw an error (true) when no route is found
 * @returns The detected language as AppLocale ('en' | 'fr')
 * @throws {Error} When no route is found and fallback is true
 */
export function getLanguage(resource: Request | URL | string, routes: RouteConfigEntry[], fallback: boolean = true): AppLocale {
  const pathname = resource instanceof Request ? new URL(resource.url).pathname :
                  resource instanceof URL ? resource.pathname :
                  resource;
  
  const route = findRouteByPathname(routes, pathname);
  if (route) {
    return (route as ExtendedRouteConfigEntry).lang;
  }
  
  console.error(`No route found for pathname: ${pathname}`);
  if (!fallback) {
    throw new Error(`No route found for pathname: ${pathname}`);
  }

  return 'en';
}

/**
 * Returns all namespaces required by the given routes by examining the route's i18nNamespaces handle property.
 * @see https://remix.run/docs/en/main/route/handle
 */
// export function getNamespaces(routes?: ({ handle?: unknown } | undefined)[]) {
//   if (routes === undefined) {
//     return [];
//   }

//   const namespaces = routes
//     .map((route) => route?.handle as RouteHandleData | undefined)
//     .map((handle) => i18nNamespacesSchema.safeParse(handle?.i18nNamespaces))
//     .flatMap((result) => (result.success ? result.data : undefined))
//     .filter((i18nNamespaces) => i18nNamespaces !== undefined);

//   return [...new Set(namespaces)];
// }

/**
 * Initializes the client instance of i18next.
 */
// export async function initI18n(namespaces: Array<string>) {
//   const { I18NEXT_DEBUG } = getEnv(process.env);
//   const i18n = createInstance();

//   const languageDetector = {
//     type: 'languageDetector',
//     detect: () => document.documentElement.lang,
//   } satisfies LanguageDetectorModule;

//   await i18n
//     .use(initReactI18next)
//     .use(languageDetector)
//     .use(I18NextHttpBackend)
//     .init({
//       appendNamespaceToMissingKey: true,
//       debug: I18NEXT_DEBUG,
//       defaultNS: false,
//       fallbackLng: false,
//       interpolation: {
//         escapeValue: false,
//       },
//       ns: namespaces,
//       preload: APP_LOCALES,
//       react: {
//         useSuspense: false,
//       },
//     });

//   return i18n;
// }

/**
 * Returns a tuple representing a typed list of namespaces.
 *
 * @template T - The primary namespace to include in the tuple.
 * @template T2 - Additional namespaces to include in the tuple. Should only contain distinct values.
 * @param ns - The primary namespace of type T.
 * @param rest - Additional namespaces of type T2 (should be distinct).
 * @returns A tuple containing the primary namespace and additional namespaces.
 *
 * @note Ensure that the values in the `rest` parameter are distinct to avoid duplicates in the resulting tuple.
 *
 * @example
 * // Usage example:
 * const result = getTypedI18nNs("common", "gcweb", "other");
 * // result is of type: readonly ["common", "gcweb", "other"]
 */
export function getTypedI18nNamespaces<const T extends Readonly<FlatNamespace>, const T2 extends ReadonlyArray<Exclude<FlatNamespace, T>>>(ns: T, ...rest: T2) {
  return [ns, ...rest] as const;
}

/**
 * Returns translation based off provided locale
 *
 * @returns either the english translation or the french translation.
 */
export function getNameByLanguage<T extends { nameEn: string; nameFr: string } | { nameEn?: string; nameFr?: string }>(language: string, obj: T): T extends { nameEn: infer N; nameFr: infer F } ? (typeof language extends 'fr' ? F : N) : never {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (language === 'fr' ? obj.nameFr : obj.nameEn) as any;
}

/**
 * Indiscriminately removes the language from a path.
 */
export function removeLanguageFromPath(path: string) {
  return path.replace(/^(\/en|\/fr)/, '');
}

/**
 * Determines the application locale based on the input string.
 *
 * @param locale - The locale string to evaluate.
 * @returns The application locale ('en' or 'fr').
 *
 * @example
 * // Returns 'en'
 * useAppLocale('en');
 *
 * @example
 * // Returns 'fr'
 * useAppLocale('fr');
 *
 * @example
 * // Returns 'en' for unsupported locale
 * useAppLocale('es');
 */
export function useAppLocale(locale: string): AppLocale {
  return locale === 'fr' ? 'fr' : 'en';
}
