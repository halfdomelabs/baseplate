import { z } from 'zod';

/**
 * Schema for validating user configuration stored in ~/.baseplate/config.json
 * This configuration allows users to persist preferences across sessions.
 */
export const userConfigSchema = z
  .object({
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
        /**
         * Editor to open when the user clicks on a file with conflicts
         */
        editor: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type BaseplateUserConfig = z.infer<typeof userConfigSchema>;
