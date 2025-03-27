import { z } from 'zod';
import validator from 'validator';
import type { FlatNamespace } from "i18next";

// Type definitions
export type Language = 'en' | 'fr';

// Schema for i18n namespaces validation
export const i18nNamespacesSchema = z
  .array(z.custom<FlatNamespace>())
  .refine((arr) => Array.isArray(arr) && arr.every((val) => typeof val === 'string' && !validator.isEmpty(val)))
  .readonly();

// Re-export routing features
//export * from './routing/index.ts';

export { useCurrentLanguage, getLanguage } from './locale-utils.ts';