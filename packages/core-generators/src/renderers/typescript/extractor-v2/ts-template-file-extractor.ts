import { getGenerationConcurrencyLimit } from '@baseplate-dev/sync';
import { createTemplateFileExtractor } from '@baseplate-dev/sync/extractor-v2';
import { camelCase } from 'change-case';
import pLimit from 'p-limit';

import { templatePathsPlugin } from '../../templates/plugins/template-paths/template-paths.plugin.js';
import { typedTemplatesFilePlugin } from '../../templates/plugins/typed-templates-file.js';
import { resolvePackagePathSpecifier } from '../../templates/utils/package-path-specifier.js';
import { tsImportBuilder } from '../imports/builder.js';
import {
  TS_TEMPLATE_TYPE,
  tsTemplateGeneratorTemplateMetadataSchema,
  tsTemplateOutputTemplateMetadataSchema,
} from '../templates/types.js';
import { TsCodeUtils } from '../utils/ts-code-utils.js';
import { extractTsTemplateVariables } from './extract-ts-template-variables.js';

const limit = pLimit(getGenerationConcurrencyLimit());

export const TsTemplateFileExtractor = createTemplateFileExtractor({
  name: TS_TEMPLATE_TYPE,
  pluginDependencies: [templatePathsPlugin, typedTemplatesFilePlugin],
  outputTemplateMetadataSchema: tsTemplateOutputTemplateMetadataSchema,
  generatorTemplateMetadataSchema: tsTemplateGeneratorTemplateMetadataSchema,
  extractTemplateFiles: async (files, context, api) => {
    const templatePathPlugin = context.getPlugin('template-paths');
    return Promise.all(
      files.map(({ metadata, absolutePath }) =>
        limit(async () => {
          const { pathRootRelativePath, generatorTemplatePath } =
            templatePathPlugin.resolveTemplatePaths(
              metadata.fileOptions,
              absolutePath,
              metadata.name,
              metadata.generator,
            );

          // Skip extraction for project exports only files
          if (!metadata.projectExportsOnly) {
            const contents = await api.readOutputFile(absolutePath);
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
          }

          return {
            generator: metadata.generator,
            generatorTemplatePath,
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
          variables: ${JSON.stringify(config.variables ?? {})},
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
