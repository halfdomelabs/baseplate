import { getGenerationConcurrencyLimit } from '@baseplate-dev/sync';
import { createTemplateFileExtractor } from '@baseplate-dev/sync/extractor-v2';
import { camelCase } from 'change-case';
import { mapValues } from 'es-toolkit';
import pLimit from 'p-limit';

import type { TextTemplateFileVariableWithValue } from './types.js';

import { templatePathsPlugin } from '../templates/plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../templates/plugins/typed-templates-file.js';
import { resolvePackagePathSpecifier } from '../templates/utils/package-path-specifier.js';
import { TsCodeUtils, tsImportBuilder } from '../typescript/index.js';
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

            const templateContents = extractTemplateVariables(
              contents,
              metadata.variables,
              absolutePath,
            );

            api.writeTemplateFile(
              metadata.generator,
              generatorTemplatePath,
              templateContents,
            );

            return {
              generator: metadata.generator,
              generatorTemplatePath,
              metadata: {
                name: metadata.name,
                type: metadata.type,
                fileOptions: metadata.fileOptions,
                pathRootRelativePath,
                variables: metadata.variables,
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
        textTemplateGeneratorTemplateMetadataSchema,
        'text',
      );
      for (const { path, config } of templates) {
        const exportName = camelCase(config.name);
        const fragment = TsCodeUtils.templateWithImports([
          tsImportBuilder(['createTextTemplateFile']).from(
            resolvePackagePathSpecifier(
              '@baseplate-dev/core-generators:src/renderers/text/types.ts',
              generatorConfig.packageName,
            ),
          ),
          tsImportBuilder().default('path').from('node:path'),
        ])`const ${exportName} = createTextTemplateFile({
          name: '${config.name}',
          source: {
            path: path.join(import.meta.dirname, '../templates/${path}'),
          },
          fileOptions: ${JSON.stringify(config.fileOptions)},
          variables: ${JSON.stringify(
            mapValues(config.variables ?? {}, (variable) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { value: _, ...variableWithoutValue } =
                variable as TextTemplateFileVariableWithValue;
              return variableWithoutValue;
            }),
          )},
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
