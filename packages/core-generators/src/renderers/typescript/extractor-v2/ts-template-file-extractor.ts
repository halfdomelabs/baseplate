import type { TemplateMetadataFileEntry } from '@baseplate-dev/sync';
import type { TemplateFileExtractorMetadataEntry } from '@baseplate-dev/sync/extractor-v2';

import { getGenerationConcurrencyLimit } from '@baseplate-dev/sync';
import { createTemplateFileExtractor } from '@baseplate-dev/sync/extractor-v2';
import { camelCase } from 'change-case';
import { mapValues } from 'es-toolkit';
import pLimit from 'p-limit';

import type { TsTemplateOutputTemplateMetadata } from '../templates/types.js';

import { templatePathsPlugin } from '../../templates/plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../../templates/plugins/typed-templates-file.js';
import { resolvePackagePathSpecifier } from '../../templates/utils/package-path-specifier.js';
import { tsImportBuilder } from '../index.js';
import {
  TS_TEMPLATE_TYPE,
  tsTemplateGeneratorTemplateMetadataSchema,
  tsTemplateOutputTemplateMetadataSchema,
} from '../templates/types.js';
import { extractTsTemplateVariables } from './extract-ts-template-variables.js';

const limit = pLimit(getGenerationConcurrencyLimit());

export const TsTemplateFileExtractor = createTemplateFileExtractor({
  name: TS_TEMPLATE_TYPE,
  pluginDependencies: [templatePathsPlugin, typedTemplatesFilePlugin],
  outputTemplateMetadataSchema: tsTemplateOutputTemplateMetadataSchema,
  generatorTemplateMetadataSchema: tsTemplateGeneratorTemplateMetadataSchema,
  extractTemplateFiles: async (files, context, api) => {
    const templatePathPlugin = context.getPlugin('template-paths');
    const metadataEntries = await Promise.all(
      files.map(({ metadata, absolutePath }) =>
        limit(
          async (): Promise<
            | TemplateFileExtractorMetadataEntry<TsTemplateOutputTemplateMetadata>
            | undefined
          > => {
            const pathRootRelativePath =
              metadata.fileOptions.kind === 'singleton'
                ? templatePathPlugin.getPathRootRelativePath(absolutePath)
                : undefined;

            // By default, singleton templates have the path like `feature-root/services/[file].ts`
            const generatorTemplatePath =
              metadata.fileOptions.generatorTemplatePath ??
              (pathRootRelativePath &&
                templatePathPlugin.getTemplatePathFromPathRootRelativePath(
                  pathRootRelativePath,
                ));

            if (!generatorTemplatePath) {
              throw new Error(
                `Template path is required for ${metadata.name} in ${metadata.generator}`,
              );
            }

            const contents = await api.readOutputFile(absolutePath);

            // Skip extraction for project exports only files
            if (metadata.projectExportsOnly) {
              api.writeTemplateFile(
                metadata.generator,
                generatorTemplatePath,
                contents,
              );
              return;
            }

            // Extract template variables from TypeScript content
            const { content: extractedContent } =
              extractTsTemplateVariables(contents);

            // TODO: Integrate import organization logic here when available
            // The v1 system uses organizeTsTemplateImports but requires:
            // - ProjectExportLookupMap
            // - ResolverFactory
            // - Project root and generator files context
            // For now, just add ts-nocheck to prevent TypeScript errors
            let processedContent = extractedContent;
            if (extractedContent.startsWith('#!')) {
              // shebang lines must always be the first line
              const contentLines = extractedContent.split('\n');
              processedContent = `${contentLines[0]}\n// @ts-nocheck\n\n${contentLines.slice(1).join('\n')}`;
            } else {
              processedContent = `// @ts-nocheck\n\n${extractedContent}`;
            }

            api.writeTemplateFile(
              metadata.generator,
              generatorTemplatePath,
              processedContent,
            );

            return {
              generator: metadata.generator,
              generatorTemplatePath,
              sourceAbsolutePath: absolutePath,
              metadata: {
                name: metadata.name,
                type: metadata.type,
                fileOptions: metadata.fileOptions,
                group: metadata.group,
                projectExports: metadata.projectExports,
                projectExportsOnly: metadata.projectExportsOnly,
                pathRootRelativePath,
              },
            };
          },
        ),
      ),
    );
    return metadataEntries.filter((entry) => entry !== undefined);
  },
  writeGeneratedFiles: (generatorNames, context) => {
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

      for (const { path, config } of templates) {
        // Skip project exports only files for now
        if (config.projectExportsOnly) {
          continue;
        }

        const exportName = camelCase(config.name);
        const fragment = TsCodeUtils.templateWithImports([
          tsImportBuilder(['createTsTemplateFile']).from(
            resolvePackagePathSpecifier(
              '@baseplate-dev/core-generators:src/renderers/typescript/templates/types.ts',
              generatorConfig.packageName,
            ),
          ),
          tsImportBuilder().default('path').from('node:path'),
        ])`const ${exportName} = createTsTemplateFile({
          name: '${config.name}',
          source: {
            path: path.join(import.meta.dirname, '../templates/${path}'),
          },
          variables: ${JSON.stringify(
            mapValues(config.variables ?? {}, (variable) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { value: _, ...variableWithoutValue } = variable;
              return variableWithoutValue;
            }),
          )},
          prefix: ${config.prefix ? `'${config.prefix}'` : 'undefined'},
          projectExports: ${JSON.stringify(config.projectExports ?? {})},
          importMapProviders: ${JSON.stringify(config.importMapProviders ?? {})},
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
