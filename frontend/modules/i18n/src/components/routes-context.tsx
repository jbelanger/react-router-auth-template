import { createContext, useContext, ReactNode } from 'react';
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { routeRegistry } from '../route-registry.ts';

interface I18nRoutesContextValue {
  routes: RouteConfigEntry[];
  findRouteById: (id: string) => RouteConfigEntry | undefined;
}

interface I18nRoutesProviderProps {
  children: ReactNode;
}

const I18nRoutesContext = createContext<I18nRoutesContextValue | null>(null);

export function I18nRoutesProvider({ children }: I18nRoutesProviderProps) {
  return (
    <I18nRoutesContext.Provider 
      value={{
        routes: routeRegistry.getRoutes(),
        findRouteById: routeRegistry.findRouteById.bind(routeRegistry)
      }}
    >
      {children}
    </I18nRoutesContext.Provider>
  );
}

export function useI18nRoutes() {
  const context = useContext(I18nRoutesContext);
  if (!context) {
    throw new Error('useI18nRoutes must be used within an I18nRoutesProvider');
  }
  return context;
}