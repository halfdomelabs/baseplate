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
      /**
       * The path root relative path of the template.
       *
       * This overrides the default detected path root relative path and should be used sparingly, e.g.
       * in cases where you want to override the default path root relative path for a singleton template.
       */
      pathRootRelativePath: z.string().optional(),
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
