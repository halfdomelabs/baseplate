import { getGenerationConcurrencyLimit } from '@baseplate-dev/sync';
import { createTemplateFileExtractor } from '@baseplate-dev/sync/extractor-v2';
import { camelCase } from 'change-case';
import { mapValues, omit } from 'es-toolkit';
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
            name: metadata.name,
            type: metadata.type,
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
