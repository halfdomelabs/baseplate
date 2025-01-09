import { z } from 'zod';

export const baseDescriptorSchema = z.object({
  name: z.string().optional(),
  generator: z.string(),
});

export type BaseGeneratorDescriptor = z.infer<typeof baseDescriptorSchema>;

export type InferGeneratorDescriptor<TSchema extends z.AnyZodObject> =
  BaseGeneratorDescriptor &
    z.input<TSchema> & {
      children?: Record<string, unknown>;
    };
