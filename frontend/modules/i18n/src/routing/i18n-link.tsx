import type { ComponentProps } from 'react';
import { generatePath, Link } from 'react-router';
import invariant from 'tiny-invariant';
import { useRouteById } from './routes-utils.tsx';

interface I18nLinkProps extends Omit<ComponentProps<typeof Link>, 'to'> {
  to: string;
  params?: Record<string, string>;
  lang?: string;
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
export function I18nLink({ children, lang = 'en', to, params, ...props }: I18nLinkProps) {
  // Handle external links
  if (to.startsWith('http')) {
    return <Link {...props} to={to}>{children}</Link>;
  }

  // Find the route for this ID and language
  const routeId = `${to}-${lang}`;
  const route = useRouteById(routeId);
  invariant(route?.path, `Route path not found for ${routeId}`);
  
  const path = params ? generatePath(route.path, params) : route.path;

  return <Link {...props} to={path}>{children}</Link>;
}