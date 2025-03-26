import { useMatches } from 'react-router';

import type { FlatNamespace, KeysByTOptions, Namespace, ParseKeysByNamespaces, TOptions } from 'i18next';
import validator from 'validator';
import { z } from 'zod';



// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ParsedKeysByNamespaces<TOpt extends TOptions = {}> = ParseKeysByNamespaces<Namespace, KeysByTOptions<TOpt>>;

/**
 * A reducer function that coalesces two values, returning the non-null (or non-undefined) value.
 */
export const coalesce = <T>(previousValue?: T, currentValue?: T) => currentValue ?? previousValue;

const i18nKeySchema = z
  .custom<ParsedKeysByNamespaces>()
  .refine((val) => typeof val === 'string' && !validator.isEmpty(val))
  .readonly();


