import {
  createTemplateFileExtractor,
  getGenerationConcurrencyLimit,
} from '@baseplate-dev/sync';
import { mapValues } from 'es-toolkit';
import pLimit from 'p-limit';

import type { TextGeneratorTemplateMetadata } from './types.js';

import { templatePathsPlugin } from '../extractor/plugins/template-paths/template-paths.plugin.js';
import { templateRenderersPlugin } from '../extractor/plugins/template-renderers/template-renderers.plugin.js';
import { typedTemplatesFilePlugin } from '../extractor/plugins/typed-templates-file.js';
import { deduplicateTemplateFileExtractorSourceFiles } from '../extractor/utils/deduplicate-templates.js';
import { renderTextTemplateRenderers } from './render-text-template-renderers.js';
import { renderTextTypedTemplates } from './render-text-typed-templates.js';
import {
  textTemplateInstanceDataSchema,
  textTemplateMetadataSchema,
} from './types.js';
import { extractTemplateVariables } from './utils.js';

const limit = pLimit(getGenerationConcurrencyLimit());

export const TextTemplateFileExtractor = createTemplateFileExtractor({
  name: 'text',
  pluginDependencies: [
    templatePathsPlugin,
    templateRenderersPlugin,
    typedTemplatesFilePlugin,
  ],
  templateMetadataSchema: textTemplateMetadataSchema,
  templateInstanceDataSchema: textTemplateInstanceDataSchema,
  extractTemplateMetadataEntries: (files, context) => {
    const deduplicatedFiles =
      deduplicateTemplateFileExtractorSourceFiles(files);
    const templatePathPlugin = context.getPlugin('template-paths');
    return deduplicatedFiles.map(
      ({
        existingMetadata,
        instanceData,
        templateName,
        generatorName,
        absolutePath,
      }) => {
        try {
          const { pathRootRelativePath, generatorTemplatePath } =
            templatePathPlugin.resolveTemplatePaths(
              existingMetadata.fileOptions,
              absolutePath,
              templateName,
              generatorName,
            );

          return {
            generator: generatorName,
            sourceAbsolutePath: absolutePath,
            templateName,
            metadata: {
              ...existingMetadata,
              sourceFile: generatorTemplatePath,
              pathRootRelativePath,
              variables: mapValues(instanceData.variables, (_, key) => ({
                description: existingMetadata.variables?.[key]?.description,
              })),
            } satisfies TextGeneratorTemplateMetadata,
            instanceData,
          };
        } catch (error) {
          throw new Error(
            `Error extracting template metadata for ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
          );
        }
      },
    );
  },
  writeTemplateFiles: async (files, _context, api) => {
    await Promise.all(
      files.map((file) =>
        limit(async () => {
          try {
            const contents = await api.readOutputFile(file.sourceAbsolutePath);

            const templateContents = extractTemplateVariables(
              contents,
              file.instanceData.variables,
              file.sourceAbsolutePath,
            );

            await api.writeTemplateFile(
              file.generator,
              file.metadata.sourceFile,
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
    const templateRenderersPlugin = context.getPlugin('template-renderers');
    const typedTemplatesPlugin = context.getPlugin('typed-templates-file');

    for (const generatorName of generatorNames) {
      const generatorConfig =
        context.configLookup.getExtractorConfigOrThrow(generatorName);
      const templates = context.configLookup.getTemplatesForGenerator(
        generatorName,
        textTemplateMetadataSchema,
        'text',
      );

      // Add the typed templates to the typed templates plugin
      const typedTemplates = renderTextTypedTemplates(templates, {
        generatorPackageName: generatorConfig.packageName,
      });
      for (const typedTemplate of typedTemplates) {
        typedTemplatesPlugin.addTemplate(generatorName, typedTemplate);
      }

      // Add the path root relative paths to the template paths plugin
      for (const { config, name } of templates) {
        if (config.pathRootRelativePath) {
          templatePathsPlugin.registerTemplatePathEntry(
            generatorName,
            name,
            config.pathRootRelativePath,
          );
        }
      }

      // Add the template renderer entries to the template renderers plugin
      const templateRenderers = renderTextTemplateRenderers(templates, {
        generatorPackageName: generatorConfig.packageName,
        generatorName,
      });
      for (const templateRenderer of templateRenderers) {
        templateRenderersPlugin.addTemplateRenderer(
          generatorName,
          templateRenderer,
        );
      }
    }
  },
});
