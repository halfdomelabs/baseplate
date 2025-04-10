import { z } from 'zod';

const configSchema = z.object({
  VITE_PREVIEW_MODE: z
    .enum(['true', 'false'])
    .nullish()
    .transform((arg) => arg === 'true'),
  VITE_ENABLE_TEMPLATE_EXTRACTOR: z
    .enum(['true', 'false'])
    .nullish()
    .transform((arg) => arg === 'true'),
});

const config = configSchema.parse(import.meta.env);

export const IS_PREVIEW = config.VITE_PREVIEW_MODE;
export const ENABLE_TEMPLATE_EXTRACTOR = config.VITE_ENABLE_TEMPLATE_EXTRACTOR;
