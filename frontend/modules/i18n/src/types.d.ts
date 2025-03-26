/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { Namespace } from 'i18next';
import { APP_LOCALES } from './locale-utils';

declare module 'react-router' {
    /**
     * Route handles should export an i18n namespace, if necessary.
     */
    interface RouteHandle {
      i18nNamespace?: Namespace;
    }
  
    /**
     * A route module exports an optional RouteHandle.
     */
    interface RouteModule {
      handle?: RouteHandle;
    }
  
    /**
     * Override the default React Router RouteModules
     * to include the new RouteModule type.
     */
    interface RouteModules extends Record<string, RouteModule | undefined> {}
  }

  /**
 * Application-scoped global types.
 */
declare global {
    /**
     * A union type representing the possible values for the application locale.
     * This type is derived from the elements of the `APP_LOCALES` array.
     */
    type AppLocale = (typeof APP_LOCALES)[number];
}