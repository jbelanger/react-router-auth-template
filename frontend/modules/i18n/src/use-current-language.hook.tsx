import { useLocation } from 'react-router';
import { getAltLanguage } from './locale-utils.ts';
import { ExtendedRouteConfigEntry, findRouteByPathname, useRoutes } from './routing/routes-utils.tsx';
import { getLogger } from '@gc-fwcs/logger';

const log = getLogger('i18n/use-current-language');

type UseCurrentLanguageReturnType = {
  altLanguage: AppLocale;
  currentLanguage: AppLocale;
};

/**
 * A hook that returns the current language and its alternate language.
 *
 * @returns An object containing the current language the alternate language.
 * @throws {Error} If no language can be detected for the current route.
 */
export function useCurrentLanguage(): UseCurrentLanguageReturnType {
  const { pathname } = useLocation();
  const routes = useRoutes();
  const r = findRouteByPathname(routes, pathname);
  if(r) {
    const currentLanguage = (r as ExtendedRouteConfigEntry).lang;
    const altLanguage = getAltLanguage(currentLanguage);
    return { altLanguage, currentLanguage };
  }

  // If no route matches the pathname, we can use the default language
  // from the URL. This is a fallback and should be handled more gracefully.
  log.warn(`No route found for pathname: ${pathname}. Falling back to default language.`);
  return { currentLanguage: 'en', altLanguage: 'fr' };
}
