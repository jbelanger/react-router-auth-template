import type { ComponentProps } from 'react';

import type { Params, To } from 'react-router';
import { generatePath, Link, useHref } from 'react-router';

import invariant from 'tiny-invariant';
import { Language } from '../index.ts';

export function getPathById(id: string, params: Params = {}): string {
  const { lang = 'en' } = params as { lang?: Language };

  const route = findRouteById(id);
  const path = route?.paths[lang];
  invariant(path, `path not found for route [${id}] and language [${lang}]`);

  return generatePath(path, params);
}
/**
 * Props for the AppLink component.
 */
export interface AppLinkProps extends Omit<ComponentProps<typeof Link>, 'to'> {
  params?: Params;
  routeId?: string;
  targetLang?: AppLocale;
  to?: To;
}

function getTo(params?: Params, routeId?: string, targetLang?: AppLocale, to?: To) {
  if (to) {
    return to;
  }

  invariant(routeId, 'either routeId or to must be provided');
  const lang = targetLang ?? params?.lang;
  return getPathById(routeId, { ...params, lang });
}

/**
 * A component that renders a localized link.
 */
export function AppLink({ children, params, routeId, targetLang, to, ...props }: AppLinkProps) {
  const href = useHref(getTo(params, routeId, targetLang, to), { relative: 'route' });

  const isExternalHref = typeof to === 'string' && to.startsWith('http');

  if (isExternalHref) {
    // external links must be respected as they are 🫡
    return (
      <Link {...props} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <Link {...props} to={href}>
      {children}
    </Link>
  );
}
