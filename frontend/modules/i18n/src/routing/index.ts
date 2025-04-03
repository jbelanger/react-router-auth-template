/** The supported application languages */
export type AppLocale = 'en' | 'fr';

// Components
export { I18nLink } from './i18n-link.tsx';

// Utilities
export { i18nRoute, I18nRoutesProvider, useCurrentLanguage, getRouteLanguage } from './routes-utils.tsx';
