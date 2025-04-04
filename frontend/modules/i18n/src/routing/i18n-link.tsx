import type { ComponentProps } from 'react';

import { Link, Params, generatePath } from 'react-router';
import invariant from 'tiny-invariant';

import { useCurrentLanguage, useRouteById } from './routes-utils.tsx';
import { AppLocale } from '../types.ts';

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
   lang?: I18nLinkLanguage;
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
export function I18nLink({ children, lang, to, params, ...props }: I18nLinkProps) {
   // Handle external links
   if (to.startsWith('http')) {
      return (
         <Link {...props} to={to}>
            {children}
         </Link>
      );
   }
   // Validate and resolve language
   if (!lang || lang === 'current') {
      lang = useCurrentLanguage();
   } else if (!isValidLanguage(lang)) {
      console.error(`Invalid language "${lang}" provided to I18nLink. Using current language.`);
      lang = useCurrentLanguage();
   }

   // Find the route for this ID and language
   const routeId = `${to}-${lang}`;
   const route = useRouteById(routeId);
   invariant(route?.path, `Route path not found for ${routeId}`);

   const path = params ? generatePath(route.path, params) : route.path;

   return (
      <Link {...props} to={path}>
         {children}
      </Link>
   );
}
