import { getGenerationConcurrencyLimit } from '@baseplate-dev/sync';
import { createTemplateFileExtractor } from '@baseplate-dev/sync/extractor-v2';
import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import { groupBy } from 'es-toolkit';
import path from 'node:path';
import pLimit from 'p-limit';

import type { WriteTsTemplateFileContext } from './render-ts-template-file.js';

import { templatePathsPlugin } from '../../templates/plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../../templates/plugins/typed-templates-file.js';
import {
  TS_TEMPLATE_TYPE,
  tsTemplateGeneratorTemplateMetadataSchema,
  tsTemplateOutputTemplateMetadataSchema,
} from '../templates/types.js';
import { buildTsProjectExportMap } from './build-ts-project-export-map.js';
import { getResolverFactory } from './get-resolver-factory.js';
import {
  GENERATED_IMPORT_PROVIDERS_FILE_NAME,
  renderTsImportProviders,
} from './render-ts-import-providers.js';
import { renderTsTemplateFile } from './render-ts-template-file.js';
import { renderTsTypedTemplates } from './render-ts-typed-templates.js';

const limit = pLimit(getGenerationConcurrencyLimit());

export const TsTemplateFileExtractor = createTemplateFileExtractor({
  name: TS_TEMPLATE_TYPE,
  pluginDependencies: [templatePathsPlugin, typedTemplatesFilePlugin],
  outputTemplateMetadataSchema: tsTemplateOutputTemplateMetadataSchema,
  generatorTemplateMetadataSchema: tsTemplateGeneratorTemplateMetadataSchema,
  extractTemplateMetadataEntries: (files, context) => {
    const templatePathPlugin = context.getPlugin('template-paths');
    return files.map(({ metadata, absolutePath }) => {
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
            ...metadata,
            pathRootRelativePath,
          },
        };
      } catch (error) {
        throw enhanceErrorWithContext(
          error,
          `Error extracting template metadata for ${absolutePath}`,
        );
      }
    });
  },
  writeTemplateFiles: async (files, context, api) => {
    // Gather all the imports from the entry metadata
    const projectExportMap = buildTsProjectExportMap(context);

    const filesByGenerator = groupBy(files, (f) => f.generator);

    await Promise.all(
      Object.entries(filesByGenerator).map(async ([generatorName, files]) => {
        const writeContext: WriteTsTemplateFileContext = {
          generatorName,
          projectExportMap,
          outputDirectory: context.outputDirectory,
          internalOutputRelativePaths: files.map((f) =>
            path.relative(context.outputDirectory, f.sourceAbsolutePath),
          ),
          resolver: getResolverFactory(context.outputDirectory),
        };

        await Promise.all(
          files.map((file) =>
            limit(async () => {
              if (file.metadata.projectExportsOnly) return;

              const contents = await api.readOutputFile(
                file.sourceAbsolutePath,
              );
              const result = await renderTsTemplateFile(
                file.sourceAbsolutePath,
                contents,
                writeContext,
              );
              api.writeTemplateFile(
                file.generator,
                file.generatorTemplatePath,
                result.contents,
              );
              // update the extractor config with the new variables and import providers
              context.configLookup.updateExtractorTemplateConfig(
                file.generator,
                {
                  ...file.metadata,
                  variables: result.variables,
                  importProviders: result.importProviders,
                },
              );
              return result;
            }),
          ),
        );
      }),
    );
  },
  writeGeneratedFiles: (generatorNames, context, api) => {
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

      // Add the typed templates to the typed templates plugin
      const typedTemplates = renderTsTypedTemplates(templates, {
        generatorPackageName: generatorConfig.packageName,
      });
      for (const typedTemplate of typedTemplates) {
        typedTemplatesPlugin.addTemplate(generatorName, typedTemplate);
      }

      // Add the path root relative paths to the template paths plugin
      for (const { config } of templates) {
        if (config.pathRootRelativePath) {
          templatePathsPlugin.registerTemplatePathEntry(
            generatorName,
            config.name,
            config.pathRootRelativePath,
          );
        }
      }

      // Render the import providers
      const pathsRootExportName =
        templatePathsPlugin.getPathsRootExportName(generatorName);
      const importProviders = renderTsImportProviders(
        generatorName,
        templates,
        {
          generatorPackageName: generatorConfig.packageName,
          pathsRootExportName,
        },
      );
      if (importProviders) {
        api.writeGeneratedFile(
          generatorName,
          GENERATED_IMPORT_PROVIDERS_FILE_NAME,
          importProviders,
        );
      }
    }
  },
});
