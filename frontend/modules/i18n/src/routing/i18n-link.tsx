import type { ComponentProps } from 'react';

import { Link, Params, To, generatePath } from 'react-router';
import invariant from 'tiny-invariant';

import { AppLocale } from '../types.ts';
import { useCurrentLanguage, useRouteById } from './routes-utils.tsx';

/**
 * Valid language options for I18nLink
 */
export type I18nLinkLanguage = AppLocale | 'current';

/**
 * Properties for the I18nLink component
 */
interface I18nLinkProps extends Omit<ComponentProps<typeof Link>, 'to'> {
   /** Route ID to link to (should be the English version ID) */
   to: string;
   /** Optional route parameters */
   params?: Params;
   /** Language to use for the link. If 'current', uses the current route's language */
   targetLang?: I18nLinkLanguage;
}

/**
 * Type guard to validate language option
 */
function isValidLanguage(lang: string): lang is I18nLinkLanguage {
   return lang === 'current' || lang === 'en' || lang === 'fr';
}

/**
 * A component that renders an internationalized link.
 * If no lang prop is provided or lang="current", uses the current route's language.
 * External URLs (starting with 'http') are passed through directly.
 *
 * @example
 * ```tsx
 * // Uses current language from route
 * <I18nLink to="protected/data">My Link</I18nLink>
 *
 * // Explicitly set language
 * <I18nLink to="protected/data" lang="fr">My Link</I18nLink>
 *
 * // External link (passed through)
 * <I18nLink to="https://example.com">External Link</I18nLink>
 * ```
 */
export function I18nLink({ children, targetLang, to, params, ...props }: I18nLinkProps) {
   // Handle external links
   if (to.startsWith('http') || to.startsWith('mailto') || to.startsWith('#')) {
      return (
         <Link {...props} to={to}>
            {children}
         </Link>
      );
   }
   // Validate and resolve language
   let resolvedLang: I18nLinkLanguage;
   if (!targetLang || targetLang === 'current') {
      resolvedLang = useCurrentLanguage();
   } else if (!isValidLanguage(targetLang)) {
      console.error(`Invalid language "${targetLang}" provided to I18nLink. Using current language.`);
      resolvedLang = useCurrentLanguage();
   } else {
      resolvedLang = targetLang;
   }

   // Find the route for this ID and language
   const routeId = `${to}-${resolvedLang}`;
   let route = useRouteById(routeId);
   // If no route found, might not be an i18nRoute
   if (!route) {
      route = useRouteById(to);
   }

   let path: To = '';
   if (!route || route.path === undefined) {
      path = to;
   } else {
      path = params ? generatePath(route.path, params) : (route.path as To);
   }

   return (
      <Link {...props} to={path}>
         {children}
      </Link>
   );
}
