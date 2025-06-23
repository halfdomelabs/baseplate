// @ts-nocheck

import { z } from 'zod';

export const baseSchema = z.object({
  name: z.string(),
});

export const dependentSchema = z.object({
  base: baseSchema,
  additional: z.string(),
});

export type BaseConfig = z.infer<typeof baseSchema>;
export type DependentConfig = z.infer<typeof dependentSchema>;
