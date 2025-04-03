export type AppLocale = 'en' | 'fr';

// Components
export { I18nLink } from './i18n-link.tsx';

// Utilities
export { 
  findRouteById,
  i18nRoute,
  I18nRoutesProvider,
  useRoutes,
  useRouteById,
  useCurrentLanguage, 
  getRouteLanguage
} from './routes-utils.tsx';