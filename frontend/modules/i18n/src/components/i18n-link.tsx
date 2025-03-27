import type { ComponentProps } from 'react';
import { generatePath, Link, Params } from 'react-router';
import type { Language } from '../index.ts';
import { useCurrentLanguage } from '../use-current-language.hook.tsx';
import { useI18nRoutes } from './routes-context.tsx';
import invariant from 'tiny-invariant';

/**
 * Props for the I18nLink component.
 */
export interface I18nLinkProps extends Omit<ComponentProps<typeof Link>, 'to'> {
  to: string;
  params?: Params;
  lang?: Language;
}

/**
 * A component that renders an internationalized link.
 * Uses current language from the route if no language is provided.
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
  const { findRouteById } = useI18nRoutes();
  //const { currentLanguage } = useCurrentLanguage();
  const targetLang = lang || "en";

  // Handle external links
  if (to.startsWith('http')) {
    return (
      <Link {...props} to={to}>
        {children}
      </Link>
    );
  }

  // Find the route for this ID and language
  const routeId = `${to}-${targetLang}`;
  const route = findRouteById(routeId);
  invariant(route?.path, `Route path not found for ${routeId}`);
  const path = generatePath(route?.path, params);

  return (
    <Link {...props} to={path}>
      {children}
    </Link>
  );
}