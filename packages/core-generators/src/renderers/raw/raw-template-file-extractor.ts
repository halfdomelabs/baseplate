import { getGenerationConcurrencyLimit } from '@baseplate-dev/sync';
import { createTemplateFileExtractor } from '@baseplate-dev/sync/extractor-v2';
import { camelCase } from 'change-case';
import pLimit from 'p-limit';

import { templatePathsPlugin } from '../plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../plugins/typed-templates-file.js';
import { TsCodeUtils, tsImportBuilder } from '../typescript/index.js';
import { resolvePackagePathSpecifier } from '../utils/package-path-specifier.js';
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
    const templatePathPlugin = context.getPlugin('template-paths');
    return files.map(({ metadata, absolutePath }) => {
      const pathRootRelativePath =
        metadata.fileOptions.kind === 'singleton'
          ? templatePathPlugin.getPathRootRelativePath(absolutePath)
          : undefined;

      // By default, singleton templates have the path like `feature-root/services/[file].ts`
      const generatorTemplatePath =
        metadata.fileOptions.generatorTemplatePath ??
        templatePathPlugin.getTemplatePathFromPathRootRelativePath(
          absolutePath,
        );

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
          pathRootRelativePath,
        },
      };
    });
  },
  writeTemplateFiles: async (files, context, api) => {
    await Promise.all(
      files.map((file) =>
        limit(async () => {
          const contents = await api.readOutputFile(file.sourceAbsolutePath);
          api.writeTemplateFile(
            file.generator,
            file.generatorTemplatePath,
            contents,
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
