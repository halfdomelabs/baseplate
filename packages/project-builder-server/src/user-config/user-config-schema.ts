import { z } from 'zod';

export const userConfigSchema = z.object({
  sync: z
    .object({
      /**
       * Whether to write the generator steps JSON file
       */
      writeGeneratorStepsJson: z.boolean().optional().default(false),
      /**
       * The custom merge driver to use
       */
      customMergeDriver: z.string().optional(),
    })
    .optional(),
});

export type BaseplateUserConfig = z.infer<typeof userConfigSchema>;
