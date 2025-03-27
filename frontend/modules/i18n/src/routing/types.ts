import type { RouteConfigEntry } from "@react-router/dev/routes";

export interface RouteHandleData {
  i18nNamespaces?: string[];
  [key: string]: unknown;
}
