import type { ComponentProps } from 'react';

import { I18nLink } from './i18n-link.tsx';
import { getAltLanguage, useCurrentLanguage, useCurrentRoute } from './routes-utils.tsx';

/**
 * Properties for the LanguageSwitchLink component
 */
interface LanguageSwitchLinkProps extends Omit<ComponentProps<typeof I18nLink>, 'to' | 'targetLang'> {
   /** Optional text to display when current language is English */
   frText?: string;
   /** Optional text to display when current language is French */
   enText?: string;
}

/**
 * A component that renders a link to switch between languages.
 * Uses the current route's ID and automatically determines the alternate language.
 *
 * @example
 * ```tsx
 * // Basic usage - will use "FR" and "EN" as default text
 * <LanguageSwitchLink />
 *
 * // Custom text for each language
 * <LanguageSwitchLink frText="Français" enText="English" />
 *
 * // With custom styling
 * <LanguageSwitchLink className="lang-switch" />
 * ```
 */
export function LanguageSwitchLink({ frText = 'FR', enText = 'EN', ...props }: LanguageSwitchLinkProps) {
   const currentRoute = useCurrentRoute();
   const currentLanguage = useCurrentLanguage();

   if (!currentRoute?.id) {
      console.error('LanguageSwitchLink: No route found');
      return null;
   }

   // Get the base route ID (remove the language suffix)
   const baseRouteId = currentRoute.id.replace(/-[a-z]{2}$/, '');

   // Get the alternate language and corresponding display text
   const altLanguage = getAltLanguage(currentLanguage);
   const displayText = currentLanguage === 'en' ? frText : enText;

   return (
      <I18nLink {...props} to={baseRouteId} reloadDocument targetLang={altLanguage}>
         {displayText}
      </I18nLink>
   );
}
