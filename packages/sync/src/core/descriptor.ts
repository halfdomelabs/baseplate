import { z } from 'zod';

export const baseDescriptorSchema = z.object({
  name: z.string().optional(),
  generator: z.string(),
  peerProvider: z.boolean().optional(),
  hoistedProviders: z.array(z.string()).optional(),
});

export type BaseGeneratorDescriptor = z.infer<typeof baseDescriptorSchema>;
