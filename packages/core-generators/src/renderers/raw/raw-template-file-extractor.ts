import type { TemplateFileExtractorMetadataEntry } from '@baseplate-dev/sync';

import {
  createTemplateFileExtractor,
  getGenerationConcurrencyLimit,
} from '@baseplate-dev/sync';
import { camelCase } from 'change-case';
import pLimit from 'p-limit';

import type { RawTemplateMetadata } from './types.js';

import { templatePathsPlugin } from '../extractor/plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../extractor/plugins/typed-templates-file.js';
import { deduplicateTemplateFileExtractorSourceFiles } from '../extractor/utils/deduplicate-templates.js';
import { resolvePackagePathSpecifier } from '../extractor/utils/package-path-specifier.js';
import { TsCodeUtils, tsImportBuilder } from '../typescript/index.js';
import { rawTemplateMetadataSchema } from './types.js';

const limit = pLimit(getGenerationConcurrencyLimit());

export const RawTemplateFileExtractor = createTemplateFileExtractor({
  name: 'raw',
  pluginDependencies: [templatePathsPlugin, typedTemplatesFilePlugin],
  templateMetadataSchema: rawTemplateMetadataSchema,
  extractTemplateMetadataEntries: (files, context) => {
    const deduplicatedFiles =
      deduplicateTemplateFileExtractorSourceFiles(files);
    const templatePathPlugin = context.getPlugin('template-paths');
    return deduplicatedFiles.map(
      ({ templateName, generatorName, existingMetadata, absolutePath }) => {
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
            },
            instanceData: {},
          } satisfies TemplateFileExtractorMetadataEntry<RawTemplateMetadata>;
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
            const contents = await api.readOutputFileBuffer(
              file.sourceAbsolutePath,
            );
            await api.writeTemplateFile(
              file.generator,
              file.metadata.sourceFile,
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
        rawTemplateMetadataSchema,
        'raw',
      );
      for (const { name, config } of templates) {
        const sourceFilePath = config.sourceFile;
        const exportName = camelCase(name);
        const fragment = TsCodeUtils.templateWithImports([
          tsImportBuilder(['createRawTemplateFile']).from(
            resolvePackagePathSpecifier(
              '@baseplate-dev/core-generators:src/renderers/raw/types.ts',
              generatorConfig.packageName,
            ),
          ),
          tsImportBuilder().default('path').from('node:path'),
        ])`const ${exportName} = createRawTemplateFile({
          name: '${name}',
          source: {
            path: path.join(import.meta.dirname, '../templates/${sourceFilePath}'),
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
            name,
            config.pathRootRelativePath,
          );
        }
      }
    }
  },
});
