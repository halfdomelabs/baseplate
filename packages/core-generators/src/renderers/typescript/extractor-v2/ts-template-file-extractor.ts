import {
  getGenerationConcurrencyLimit,
  templateFileMetadataBaseSchema,
} from '@baseplate-dev/sync';
import {
  createTemplateFileExtractor,
  templateConfigSchema,
} from '@baseplate-dev/sync/extractor-v2';
import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { camelCase } from 'change-case';
import { mapValues } from 'es-toolkit';
import pLimit from 'p-limit';
import { z } from 'zod';

import type { TsCodeFragment } from '../fragments/types.js';

import { templateFileOptionsSchema } from '../../schemas/template-file-options.js';
import { templatePathsPlugin } from '../../templates/plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../../templates/plugins/typed-templates-file.js';
import { resolvePackagePathSpecifier } from '../../templates/utils/package-path-specifier.js';
import { TsCodeUtils, tsImportBuilder } from '../index.js';
import { extractTsTemplateVariables } from './extract-ts-template-variables.js';

const limit = pLimit(getGenerationConcurrencyLimit());

export const TS_TEMPLATE_TYPE = 'ts';

const tsTemplateFileVariableSchema = z.object({
  description: z.string().optional(),
});

export const tsTemplateGeneratorTemplateMetadataSchema =
  templateConfigSchema.extend({
    /**
     * The options for the template file
     */
    fileOptions: templateFileOptionsSchema,
    /**
     * The path of the template relative to the closest file path root.
     */
    pathRootRelativePath: z.string().optional(),
    /**
     * The group to assign the template to when generating the typed templates.
     */
    group: CASE_VALIDATORS.KEBAB_CASE.optional(),
    /**
     * The name of the export group that this template belongs to. Export groups
     * allow you to group templates together that share the same import provider.
     */
    exportGroup: CASE_VALIDATORS.KEBAB_CASE.optional(),
    /**
     * The exports of the file that are unique across the project.
     */
    projectExports: z
      .record(
        z.string(),
        z.object({
          /**
           * Whether the export is a type only export.
           */
          isTypeOnly: z.boolean().optional(),
          /**
           * The exported name of the export within the file. Use 'default' for default exports.
           */
          exportName: z.string().optional(),
        }),
      )
      .optional(),
    /**
     * Whether the template is only exporting types and we should not attempt to extract
     * the contents of the template.
     */
    projectExportsOnly: z.boolean().optional(),
    /**
     * The variables for the template.
     */
    variables: z.record(z.string(), tsTemplateFileVariableSchema).optional(),
    /**
     * The prefix to use for the template variables.
     * @default 'TPL_'
     */
    prefix: z.string().optional(),
    /**
     * Import map providers that will be used to resolve imports for the template.
     */
    importMapProviders: z.record(z.string(), z.any()).optional(),
  });

export const tsTemplateOutputTemplateMetadataSchema =
  templateFileMetadataBaseSchema.extend({
    /**
     * The type of the template (always `ts`)
     */
    type: z.literal(TS_TEMPLATE_TYPE),
    /**
     * The options for the template file
     */
    fileOptions: templateFileOptionsSchema,
    /**
     * The group to assign the template to when generating the typed templates.
     */
    group: CASE_VALIDATORS.KEBAB_CASE.optional(),
    /**
     * The name of the export group that this template belongs to.
     */
    exportGroup: CASE_VALIDATORS.KEBAB_CASE.optional(),
    /**
     * The exports of the file that are unique across the project.
     */
    projectExports: z
      .record(
        z.string(),
        z.object({
          isTypeOnly: z.boolean().optional(),
          exportName: z.string().optional(),
        }),
      )
      .optional(),
    /**
     * Whether the template is only exporting types.
     */
    projectExportsOnly: z.boolean().optional(),
    /**
     * The variables for the template with their extracted values.
     */
    variables: z
      .record(
        z.string(),
        tsTemplateFileVariableSchema.extend({
          value: z.any(), // TsCodeFragment or string
        }),
      )
      .optional(),
    /**
     * The prefix used for template variables.
     */
    prefix: z.string().optional(),
    /**
     * Import map providers used for the template.
     */
    importMapProviders: z.record(z.string(), z.any()).optional(),
  });

/**
 * Metadata for a TypeScript template file
 */
export type TsTemplateOutputTemplateMetadata = z.infer<
  typeof tsTemplateOutputTemplateMetadataSchema
>;

/**
 * A variable for a TypeScript template.
 */
export type TsTemplateFileVariable = z.infer<
  typeof tsTemplateFileVariableSchema
>;

/**
 * A variable for a TypeScript template with a value.
 */
export type TsTemplateFileVariableWithValue = TsTemplateFileVariable & {
  value: TsCodeFragment | string;
};

export const TsTemplateFileExtractor = createTemplateFileExtractor({
  name: TS_TEMPLATE_TYPE,
  pluginDependencies: [templatePathsPlugin, typedTemplatesFilePlugin],
  outputTemplateMetadataSchema: tsTemplateOutputTemplateMetadataSchema,
  generatorTemplateMetadataSchema: tsTemplateGeneratorTemplateMetadataSchema,
  extractTemplateMetadataEntries: (files, context) => {
    const templatePathPlugin = context.getPlugin('template-paths');
    return files.map(({ metadata, absolutePath }) => {
      const pathRootRelativePath =
        metadata.fileOptions.kind === 'singleton'
          ? templatePathPlugin.getPathRootRelativePath(absolutePath)
          : undefined;

      // By default, singleton templates have the path like `feature-root/services/[file].ts`
      const generatorTemplatePath =
        metadata.fileOptions.generatorTemplatePath ??
        (pathRootRelativePath &&
          templatePathPlugin.getTemplatePathFromPathRootRelativePath(
            pathRootRelativePath,
          ));

      if (!generatorTemplatePath) {
        throw new Error(
          `Template path is required for ${metadata.name} in ${metadata.generator}`,
        );
      }

      return {
        generator: metadata.generator,
        generatorTemplatePath,
        sourceAbsolutePath: absolutePath,
        metadata: {
          name: metadata.name,
          type: metadata.type,
          fileOptions: metadata.fileOptions,
          group: metadata.group,
          exportGroup: metadata.exportGroup,
          projectExports: metadata.projectExports,
          projectExportsOnly: metadata.projectExportsOnly,
          pathRootRelativePath,
          variables: metadata.variables,
          prefix: metadata.prefix,
          importMapProviders: metadata.importMapProviders,
        },
      };
    });
  },
  writeTemplateFiles: async (files, _context, api) => {
    await Promise.all(
      files.map((file) =>
        limit(async () => {
          const contents = await api.readOutputFile(file.sourceAbsolutePath);
          const { metadata } = file;

          // Skip extraction for project exports only files
          if (metadata.projectExportsOnly) {
            api.writeTemplateFile(
              file.generator,
              file.generatorTemplatePath,
              contents,
            );
            return;
          }

          // Extract template variables from TypeScript content
          const { content: extractedContent } =
            extractTsTemplateVariables(contents);

          // TODO: Integrate import organization logic here when available
          // The v1 system uses organizeTsTemplateImports but requires:
          // - ProjectExportLookupMap
          // - ResolverFactory
          // - Project root and generator files context
          // For now, just add ts-nocheck to prevent TypeScript errors
          let processedContent = extractedContent;
          if (extractedContent.startsWith('#!')) {
            // shebang lines must always be the first line
            const contentLines = extractedContent.split('\n');
            processedContent = `${contentLines[0]}\n// @ts-nocheck\n\n${contentLines.slice(1).join('\n')}`;
          } else {
            processedContent = `// @ts-nocheck\n\n${extractedContent}`;
          }

          api.writeTemplateFile(
            file.generator,
            file.generatorTemplatePath,
            processedContent,
          );
        }),
      ),
    );
  },
  writeGeneratedFiles: (generatorNames, context) => {
    const templatePathsPlugin = context.getPlugin('template-paths');
    const typedTemplatesPlugin = context.getPlugin('typed-templates-file');

    for (const generatorName of generatorNames) {
      const generatorConfig =
        context.configLookup.getExtractorConfigOrThrow(generatorName);
      const templates = context.configLookup.getTemplatesForGenerator(
        generatorName,
        tsTemplateGeneratorTemplateMetadataSchema,
        TS_TEMPLATE_TYPE,
      );

      for (const { path, config } of templates) {
        // Skip project exports only files for now
        if (config.projectExportsOnly) {
          continue;
        }

        const exportName = camelCase(config.name);
        const fragment = TsCodeUtils.templateWithImports([
          tsImportBuilder(['createTsTemplateFile']).from(
            resolvePackagePathSpecifier(
              '@baseplate-dev/core-generators:src/renderers/typescript/templates/types.ts',
              generatorConfig.packageName,
            ),
          ),
          tsImportBuilder().default('path').from('node:path'),
        ])`const ${exportName} = createTsTemplateFile({
          name: '${config.name}',
          source: {
            path: path.join(import.meta.dirname, '../templates/${path}'),
          },
          variables: ${JSON.stringify(
            mapValues(config.variables ?? {}, (variable) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { value: _, ...variableWithoutValue } =
                variable as TsTemplateFileVariableWithValue;
              return variableWithoutValue;
            }),
          )},
          prefix: ${config.prefix ? `'${config.prefix}'` : 'undefined'},
          projectExports: ${JSON.stringify(config.projectExports ?? {})},
          importMapProviders: ${JSON.stringify(config.importMapProviders ?? {})},
        });`;

        typedTemplatesPlugin.addTemplate(generatorName, {
          exportName,
          fragment,
        });

        if (config.pathRootRelativePath) {
          templatePathsPlugin.registerTemplatePathEntry(
            generatorName,
            config.name,
            config.pathRootRelativePath,
          );
        }
      }
    }
  },
});
