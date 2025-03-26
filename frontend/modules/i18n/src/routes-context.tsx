import { createContext, useContext, ReactNode } from 'react';
import type { RouteConfigEntry } from "@react-router/dev/routes";
import type { I18nRoute } from './index.ts';

interface I18nRoutesContextValue {
  routes: RouteConfigEntry[];
  helper: {
    findRouteById: (id: string) => I18nRoute | undefined;
    useI18nNamespaces: () => string[];
  };
}

const I18nRoutesContext = createContext<I18nRoutesContextValue | null>(null);

interface I18nRoutesProviderProps {
  children: ReactNode;
  value: I18nRoutesContextValue;
}

export function I18nRoutesProvider({ children, value }: I18nRoutesProviderProps) {
  return (
    <I18nRoutesContext.Provider value={value}>
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