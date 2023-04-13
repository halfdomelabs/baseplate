import { z } from 'zod';

const configSchema = z.object({
  VITE_PREVIEW_MODE: z
    .enum(['true', 'false'])
    .nullish()
    .transform((arg) => arg === 'true'),
});

export const config = configSchema.parse(import.meta.env);
