import { getGenerationConcurrencyLimit } from '@baseplate-dev/sync';
import { createTemplateFileExtractor } from '@baseplate-dev/sync/extractor-v2';
import { mapValues, omit } from 'es-toolkit';
import pLimit from 'p-limit';

import { templatePathsPlugin } from '../extractor/plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../extractor/plugins/typed-templates-file.js';
import { deduplicateTemplateFileExtractorSourceFiles } from '../extractor/utils/deduplicate-templates.js';
import { renderTextTypedTemplates } from './render-text-typed-templates.js';
import {
  textTemplateGeneratorTemplateMetadataSchema,
  textTemplateOutputTemplateMetadataSchema,
} from './types.js';
import { extractTemplateVariables } from './utils.js';

const limit = pLimit(getGenerationConcurrencyLimit());

export const TextTemplateFileExtractor = createTemplateFileExtractor({
  name: 'text',
  pluginDependencies: [templatePathsPlugin, typedTemplatesFilePlugin],
  outputTemplateMetadataSchema: textTemplateOutputTemplateMetadataSchema,
  generatorTemplateMetadataSchema: textTemplateGeneratorTemplateMetadataSchema,
  extractTemplateMetadataEntries: (files, context) => {
    const deduplicatedFiles =
      deduplicateTemplateFileExtractorSourceFiles(files);
    const templatePathPlugin = context.getPlugin('template-paths');
    return deduplicatedFiles.map(({ metadata, absolutePath }) => {
      try {
        const { pathRootRelativePath, generatorTemplatePath } =
          templatePathPlugin.resolveTemplatePaths(
            metadata.fileOptions,
            absolutePath,
            metadata.name,
            metadata.generator,
          );

        return {
          generator: metadata.generator,
          generatorTemplatePath,
          sourceAbsolutePath: absolutePath,
          metadata: {
            name: metadata.name,
            type: metadata.type,
            group: metadata.group,
            fileOptions: metadata.fileOptions,
            pathRootRelativePath,
            variables: mapValues(metadata.variables ?? {}, (variable) =>
              omit(variable, ['value']),
            ),
          },
          extractionContext: {
            variables: metadata.variables ?? {},
          },
        };
      } catch (error) {
        throw new Error(
          `Error extracting template metadata for ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
    });
  },
  writeTemplateFiles: async (files, _context, api) => {
    await Promise.all(
      files.map((file) =>
        limit(async () => {
          try {
            const contents = await api.readOutputFile(file.sourceAbsolutePath);

            const templateContents = extractTemplateVariables(
              contents,
              file.extractionContext?.variables ?? {},
              file.sourceAbsolutePath,
            );

            api.writeTemplateFile(
              file.generator,
              file.generatorTemplatePath,
              templateContents,
            );
          } catch (error) {
            throw new Error(
              `Error writing template file for ${file.sourceAbsolutePath}: ${error instanceof Error ? error.message : String(error)}`,
              { cause: error },
            );
          }
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
        textTemplateGeneratorTemplateMetadataSchema,
        'text',
      );

      const typedTemplates = renderTextTypedTemplates(templates, {
        generatorPackageName: generatorConfig.packageName,
      });

      for (const typedTemplate of typedTemplates) {
        typedTemplatesPlugin.addTemplate(generatorName, typedTemplate);
      }

      for (const { config } of templates) {
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
