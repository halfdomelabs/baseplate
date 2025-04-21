import { z } from 'zod';

export const userConfigSchema = z.object({
  sync: z
    .object({
      /**
       * Whether to write the generator steps JSON file
       */
      writeGeneratorStepsJson: z.boolean().optional().default(false),
      /**
       * The merge driver to use following the custom merge driver command for custom Git merge drivers
       * instead of the default 3-way merge driver.
       *
       * See https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
       */
      customMergeDriver: z.string().optional(),
    })
    .optional(),
});

export type BaseplateUserConfig = z.infer<typeof userConfigSchema>;
