import { getGenerationConcurrencyLimit } from '@baseplate-dev/sync';
import { createTemplateFileExtractor } from '@baseplate-dev/sync/extractor-v2';
import { camelCase } from 'change-case';
import pLimit from 'p-limit';

import { templatePathsPlugin } from '../templates/plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../templates/plugins/typed-templates-file.js';
import { resolvePackagePathSpecifier } from '../templates/utils/package-path-specifier.js';
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
  extractTemplateFiles: (files, context, api) => {
    const templatePathPlugin = context.getPlugin('template-paths');

    return Promise.all(
      files.map(({ metadata, absolutePath }) =>
        limit(async () => {
          try {
            const { pathRootRelativePath, generatorTemplatePath } =
              templatePathPlugin.resolveTemplatePaths(
                metadata.fileOptions,
                absolutePath,
                metadata.name,
                metadata.generator,
              );

            const contents = await api.readOutputFile(absolutePath);
            api.writeTemplateFile(
              metadata.generator,
              generatorTemplatePath,
              contents,
            );

            return {
              generator: metadata.generator,
              generatorTemplatePath,
              metadata: {
                name: metadata.name,
                type: metadata.type,
                fileOptions: metadata.fileOptions,
                pathRootRelativePath,
              },
            };
          } catch (error) {
            throw new Error(
              `Error extracting template file at ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`,
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
