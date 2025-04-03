import type { ComponentProps } from 'react';
import { generatePath, Link, Params } from 'react-router';
import invariant from 'tiny-invariant';
import { useCurrentLanguage, useRouteById } from './routes-utils.tsx';
import { AppLocale } from './index.ts';

interface I18nLinkProps extends Omit<ComponentProps<typeof Link>, 'to'> {
  to: string;
  params?: Params;
  lang?: AppLocale | 'current'; // 'current' will use the current language from the route
}

/**
 * A component that renders an internationalized link.
 * Uses 'en' as default language if none provided.
 * @example
 * ```tsx
 * // Uses current language from route
 * <I18nLink to="protected/data">My Link</I18nLink>
 * 
 * // Explicitly set language
 * <I18nLink to="protected/data" lang="fr">My Link</I18nLink>
 * ```
 */
export function I18nLink({ children, lang, to, params, ...props }: I18nLinkProps) {
  // Handle external links
  if (to.startsWith('http')) {
    return <Link {...props} to={to}>{children}</Link>;
  }

  if(!lang || lang === 'current') {
    lang = useCurrentLanguage();
  }
    
  // Find the route for this ID and language
  const routeId = `${to}-${lang}`;
  const route = useRouteById(routeId);
  invariant(route?.path, `Route path not found for ${routeId}`);
  
  const path = params ? generatePath(route.path, params) : route.path;

  return <Link {...props} to={path}>{children}</Link>;
}