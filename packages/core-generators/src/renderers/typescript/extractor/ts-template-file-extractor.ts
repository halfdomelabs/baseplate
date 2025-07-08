import {
  createTemplateFileExtractor,
  getGenerationConcurrencyLimit,
} from '@baseplate-dev/sync';
import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import { groupBy } from 'es-toolkit';
import path from 'node:path';
import pLimit from 'p-limit';
import { z } from 'zod';

import { templateExtractorBarrelExportPlugin } from '#src/renderers/extractor/index.js';
import { deduplicateTemplateFileExtractorSourceFiles } from '#src/renderers/extractor/utils/deduplicate-templates.js';

import type { TsTemplateMetadata } from '../templates/types.js';
import type { WriteTsTemplateFileContext } from './render-ts-template-file.js';

import { templatePathsPlugin } from '../../extractor/plugins/template-paths/template-paths.plugin.js';
import { templateRenderersPlugin } from '../../extractor/plugins/template-renderers/template-renderers.plugin.js';
import { typedTemplatesFilePlugin } from '../../extractor/plugins/typed-templates-file.js';
import {
  TS_TEMPLATE_TYPE,
  tsTemplateMetadataSchema,
} from '../templates/types.js';
import { buildExternalImportProvidersMap } from './build-external-import-providers-map.js';
import { buildTsProjectExportMap } from './build-ts-project-export-map.js';
import { getResolverFactory } from './get-resolver-factory.js';
import {
  GENERATED_IMPORT_PROVIDERS_FILE_NAME,
  renderTsImportProviders,
} from './render-ts-import-providers.js';
import { renderTsTemplateFile } from './render-ts-template-file.js';
import { renderTsTemplateRenderers } from './render-ts-template-renderers.js';
import { renderTsTypedTemplates } from './render-ts-typed-templates.js';
import { tsExtractorConfigSchema } from './ts-extractor-config.schema.js';

const limit = pLimit(getGenerationConcurrencyLimit());

export const TsTemplateFileExtractor = createTemplateFileExtractor({
  name: TS_TEMPLATE_TYPE,
  pluginDependencies: [
    templatePathsPlugin,
    templateRenderersPlugin,
    typedTemplatesFilePlugin,
    templateExtractorBarrelExportPlugin,
  ],
  templateMetadataSchema: tsTemplateMetadataSchema,
  templateInstanceDataSchema: z.object({}),
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
            metadata: {
              ...existingMetadata,
              sourceFile: generatorTemplatePath,
              pathRootRelativePath,
            } satisfies TsTemplateMetadata,
            instanceData,
            templateName,
          };
        } catch (error) {
          throw enhanceErrorWithContext(
            error,
            `Error extracting template metadata for ${absolutePath}`,
          );
        }
      },
    );
  },
  writeTemplateFiles: async (files, context, api, allFiles) => {
    // Build a map of generators to template names to the output relative paths of the template.
    const templatesOutputRelativePathMap = new Map<
      string,
      Map<string, string[]>
    >();
    for (const file of allFiles) {
      const outputRelativePath = path.relative(
        context.outputDirectory,
        file.absolutePath,
      );
      const { generator } = file.templateInfo;
      let generatorMap = templatesOutputRelativePathMap.get(generator);
      if (!generatorMap) {
        generatorMap = new Map();
        templatesOutputRelativePathMap.set(generator, generatorMap);
      }
      generatorMap.set(file.templateInfo.template, [
        ...(generatorMap.get(file.templateInfo.template) ?? []),
        outputRelativePath,
      ]);
    }

    // Gather all the imports from the entry metadata
    const externalImportProvidersMap = buildExternalImportProvidersMap(
      context.configLookup,
    );
    const projectExportMap = buildTsProjectExportMap(
      context,
      externalImportProvidersMap,
      templatesOutputRelativePathMap,
    );

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
              await api.writeTemplateFile(
                file.generator,
                file.metadata.sourceFile,
                result.contents,
              );
              // update the extractor config with the new variables and import providers
              context.configLookup.updateExtractorTemplateConfig(
                file.generator,
                file.templateName,
                {
                  ...file.metadata,
                  variables: result.variables,
                  importMapProviders: result.importProviders,
                } as TsTemplateMetadata,
              );
              return result;
            }),
          ),
        );
      }),
    );
  },
  writeGeneratedFiles: async (generatorNames, context, api) => {
    const templatePathsPlugin = context.getPlugin('template-paths');
    const templateRenderersPlugin = context.getPlugin('template-renderers');
    const typedTemplatesPlugin = context.getPlugin('typed-templates-file');
    const barrelExportPlugin = context.getPlugin('barrel-export');
    const externalImportProvidersMap = buildExternalImportProvidersMap(
      context.configLookup,
    );

    for (const generatorName of generatorNames) {
      const generatorConfig =
        context.configLookup.getExtractorConfigOrThrow(generatorName);
      const templates = context.configLookup.getTemplatesForGenerator(
        generatorName,
        tsTemplateMetadataSchema,
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
      const templateRenderers = renderTsTemplateRenderers(templates, {
        generatorPackageName: generatorConfig.packageName,
        generatorName,
      });
      for (const templateRenderer of templateRenderers) {
        templateRenderersPlugin.addTemplateRenderer(
          generatorName,
          templateRenderer,
        );
      }

      // Render the import providers
      const pathsRootExportName =
        templatePathsPlugin.getPathsRootExportName(generatorName);

      // Get the TypeScript extractor configuration
      const tsExtractorConfig =
        context.configLookup.getExtractorConfigForGenerator(
          generatorName,
          'ts',
          tsExtractorConfigSchema,
        );

      const importProviders = renderTsImportProviders(
        generatorName,
        templates,
        {
          generatorPackageName: generatorConfig.packageName,
          pathsRootExportName,
          externalImportProvidersMap,
        },
        tsExtractorConfig,
      );
      if (importProviders) {
        await api.writeGeneratedFile(
          generatorName,
          GENERATED_IMPORT_PROVIDERS_FILE_NAME,
          importProviders.contents,
        );
        for (const barrelExport of importProviders.barrelExports) {
          barrelExportPlugin.addBarrelExport(generatorName, barrelExport);
        }
        for (const barrelExport of importProviders.generatorBarrelExports) {
          barrelExportPlugin.addGeneratedBarrelExport(
            generatorName,
            barrelExport,
          );
        }
      }
    }
  },
});
