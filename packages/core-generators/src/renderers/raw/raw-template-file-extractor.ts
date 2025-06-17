import { getGenerationConcurrencyLimit } from '@baseplate-dev/sync';
import { createTemplateFileExtractor } from '@baseplate-dev/sync/extractor-v2';
import { camelCase } from 'change-case';
import pLimit from 'p-limit';

import { templatePathsPlugin } from '../extractor/plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../extractor/plugins/typed-templates-file.js';
import { deduplicateTemplateFileExtractorSourceFiles } from '../extractor/utils/deduplicate-templates.js';
import { resolvePackagePathSpecifier } from '../extractor/utils/package-path-specifier.js';
import { TsCodeUtils, tsImportBuilder } from '../typescript/index.js';
import {
  rawTemplateGeneratorTemplateMetadataSchema,
  rawTemplateOutputTemplateMetadataSchema,
} from './types.js';

const limit = pLimit(getGenerationConcurrencyLimit());

export const RawTemplateFileExtractor = createTemplateFileExtractor({
  name: 'raw',
  pluginDependencies: [templatePathsPlugin, typedTemplatesFilePlugin],
  outputTemplateMetadataSchema: rawTemplateOutputTemplateMetadataSchema,
  generatorTemplateMetadataSchema: rawTemplateGeneratorTemplateMetadataSchema,
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
            fileOptions: metadata.fileOptions,
            pathRootRelativePath,
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
            const contents = await api.readOutputFileBuffer(
              file.sourceAbsolutePath,
            );
            await api.writeTemplateFile(
              file.generator,
              file.generatorTemplatePath,
              contents,
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
        rawTemplateGeneratorTemplateMetadataSchema,
        'raw',
      );
      for (const { path, config } of templates) {
        const exportName = camelCase(config.name);
        const fragment = TsCodeUtils.templateWithImports([
          tsImportBuilder(['createRawTemplateFile']).from(
            resolvePackagePathSpecifier(
              '@baseplate-dev/core-generators:src/renderers/raw/types.ts',
              generatorConfig.packageName,
            ),
          ),
          tsImportBuilder().default('path').from('node:path'),
        ])`const ${exportName} = createRawTemplateFile({
          name: '${config.name}',
          source: {
            path: path.join(import.meta.dirname, '../templates/${path}'),
          },
          fileOptions: ${JSON.stringify(config.fileOptions)},
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
