import { z } from 'zod';

export const templateFileOptionsSchema = z
  .discriminatedUnion('kind', [
    z.object({
      kind: z.literal('singleton').optional().default('singleton'),
      /**
       * The path of the template in the generator's `templates/` directory.
       *
       * Defaults to template path if not provided.
       */
      generatorTemplatePath: z.string().optional(),
    }),
    z.object({
      kind: z.literal('instance'),
      /**
       * The path of the template in the generator's `templates/` directory.
       */
      generatorTemplatePath: z.string(),
    }),
  ])
  .default({ kind: 'singleton' });

export type TemplateFileOptions = z.infer<typeof templateFileOptionsSchema>;
