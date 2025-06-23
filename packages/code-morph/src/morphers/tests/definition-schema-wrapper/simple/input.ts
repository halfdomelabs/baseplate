// @ts-nocheck

import { z } from 'zod';

export const enumValueSchema = z.object({
  name: z.string().min(1),
  friendlyName: z.string().min(1),
});

export type EnumValueConfig = z.infer<typeof enumValueSchema>;

export const enumSchema = z.object({
  name: z.string().min(1),
  values: z.array(enumValueSchema),
  isExposed: z.boolean(),
});

export type EnumConfig = z.infer<typeof enumSchema>;

export type EnumConfigInput = z.input<typeof enumSchema>;
