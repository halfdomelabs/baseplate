import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import { appEntityType } from './types.js';

/** Whether a string is a bare http(s) origin, with no path, query or hash. */
function isOrigin(url: string): boolean {
  if (!z.url({ protocol: /^https?$/ }).safeParse(url).success) return false;
  const parsed = new URL(url);
  return parsed.pathname === '/' && !parsed.search && !parsed.hash;
}

/**
 * The public origin an app is served from, e.g. "https://app.example.com".
 *
 * Blank means "derive it from `devPort`". Read it through `getAppUrls`, which
 * resolves that fallback and strips any trailing slash.
 */
const appUrlValidator = z
  .string()
  .default('')
  .refine(
    (url) => url === '' || isOrigin(url),
    'Must be an origin without a path, e.g. https://app.example.com',
  );

export const baseAppValidators = {
  id: z.string().default(appEntityType.generateNewId()),
  name: CASE_VALIDATORS.KEBAB_CASE,
  type: z.string(),
  devPort: z.number().int().positive().max(65_535).optional(),
  url: appUrlValidator,
} as const;

export const baseAppSchema = z.object(baseAppValidators);

export type BaseAppConfig = z.infer<typeof baseAppSchema>;
