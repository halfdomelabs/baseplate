import { getGenerationConcurrencyLimit } from '@baseplate-dev/sync';
import { createTemplateFileExtractor } from '@baseplate-dev/sync/extractor-v2';
import { camelCase } from 'change-case';
import { escapeRegExp, mapValues } from 'es-toolkit';
import pLimit from 'p-limit';

import type {
  TextTemplateFileVariable,
  TextTemplateFileVariableWithValue,
} from './types.js';

import { templatePathsPlugin } from '../plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../plugins/typed-templates-file.js';
import { TsCodeUtils, tsImportBuilder } from '../typescript/index.js';
import { resolvePackagePathSpecifier } from '../utils/package-path-specifier.js';
import {
  textTemplateGeneratorTemplateMetadataSchema,
  textTemplateOutputTemplateMetadataSchema,
} from './types.js';

const limit = pLimit(getGenerationConcurrencyLimit());

/**
 * Get the delimiters for a text template file.
 * @param filename The filename of the text template file.
 * @returns The delimiters for the text template file.
 */
function getTextTemplateDelimiters(filename: string): {
  start: string;
  end: string;
} {
  if (filename.endsWith('.css')) {
    return {
      start: '/* ',
      end: ' */',
    };
  }

  // no delimiters for gql files
  if (filename.endsWith('.gql')) {
    return {
      start: '',
      end: '',
    };
  }

  return {
    start: '{{',
    end: '}}',
  };
}

/**
 * Get the regex for a text template variable.
 *
 * If the variable is an identifier, we check for non-alphanumeric characters around
 * the variable name.
 *
 * @param variable The variable to get the regex for.
 * @param value The value of the variable.
 * @returns The regex for the text template variable.
 */
function getTextTemplateVariableRegExp(
  variable: TextTemplateFileVariable,
  value: string,
): RegExp {
  return variable.isIdentifier
    ? new RegExp(`(?<!\\w)${escapeRegExp(value)}(?!\\w)`, 'g')
    : new RegExp(escapeRegExp(value), 'g');
}

export const TextTemplateFileExtractor = createTemplateFileExtractor({
  name: 'text',
  pluginDependencies: [templatePathsPlugin, typedTemplatesFilePlugin],
  outputTemplateMetadataSchema: textTemplateOutputTemplateMetadataSchema,
  generatorTemplateMetadataSchema: textTemplateGeneratorTemplateMetadataSchema,
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
          variables: metadata.variables,
        },
      };
    });
  },
  writeTemplateFiles: async (files, context, api) => {
    await Promise.all(
      files.map((file) =>
        limit(async () => {
          const contents = await api.readOutputFile(file.sourceAbsolutePath);
          const { metadata } = file;
          const { start, end } = getTextTemplateDelimiters(
            file.sourceAbsolutePath,
          );

          // replace variable values with template string
          let templateContents = contents;
          for (const [key, variableWithValue] of Object.entries(
            metadata.variables ?? {},
          )) {
            // variableWithValue has the 'value' property, we need to remove it for the variable definition
            const { value, ...variable } =
              variableWithValue as TextTemplateFileVariableWithValue;
            const variableRegex = getTextTemplateVariableRegExp(
              variable,
              value,
            );
            const newTemplateContents = templateContents.replaceAll(
              variableRegex,
              `${start}${key}${end}`,
            );
            if (newTemplateContents === templateContents) {
              throw new Error(
                `Variable ${key} with value ${value} not found in template ${file.sourceAbsolutePath}`,
              );
            }
            templateContents = newTemplateContents;
          }

          api.writeTemplateFile(
            file.generator,
            file.generatorTemplatePath,
            templateContents,
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
