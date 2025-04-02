import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";
import { useMatches } from "react-router";

/**
 * A type-safe hook for using translations in routes that enforces proper handle configuration
 */
export function useRouteTranslation() {
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];

  // Check if route has handle.i18n configuration
  invariant(
    lastMatch?.handle?.i18n,
    `[i18n] Route "${lastMatch?.pathname ?? 'unknown'}" is using translations but missing handle.i18n configuration.
    Fix: Add the following to your route:
    export const handle = { i18n: "namespace" };`
  );

  return useTranslation(lastMatch.handle.i18n);
}