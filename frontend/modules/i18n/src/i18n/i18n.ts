export interface I18nConfig {
  debug?: boolean;
  /**
   * Default namespace used if not passed to translation function
   * @default 'translation'
   */
  defaultNS?: string | false | readonly string[];
}

export const i18nDefaults = {
    appendNamespaceToMissingKey: true,
    debug: false,
  supportedLngs: ["en", "fr"],
  fallbackLng: "en",
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  preload: ["en", "fr"],
  react: { useSuspense: false },
};

/**
 * Adds defaultNS to the namespaces array if it's not already included
 * @param ns - Current array of namespaces
 * @param defaultNS - Default namespace(s) to add if missing
 * @returns Updated array of namespaces
 */
export function addDefaultNamespaces(ns: string[], defaultNS?: string | false | readonly string[]): string[] {
  if (!defaultNS) return ns;

  const defaultNSArray = Array.isArray(defaultNS) ? defaultNS : [defaultNS];
  const newNamespaces = defaultNSArray.filter(namespace => !ns.includes(namespace));

  return newNamespaces.length > 0 ? [...ns, ...newNamespaces] : ns;
}