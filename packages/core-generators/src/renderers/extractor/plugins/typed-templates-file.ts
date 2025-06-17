import {
  createTemplateExtractorPlugin,
  TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY,
} from '@baseplate-dev/sync/extractor-v2';
import { posixJoin } from '@baseplate-dev/utils/node';

import { normalizeTsPathToJsPath } from '#src/utils/ts-paths.js';

import type { TsCodeFragment } from '../../typescript/index.js';

import {
  renderTsCodeFileTemplate,
  TsCodeUtils,
} from '../../typescript/index.js';
import { getGeneratedTemplateConstantName } from '../utils/index.js';
import { templateExtractorBarrelExportPlugin } from './barrel-export.js';
import { templatePathsPlugin } from './template-paths/template-paths.plugin.js';

const TYPED_TEMPLATES_FILE_NAME = 'typed-templates.ts';

const TYPED_TEMPLATES_FILE_PATH = posixJoin(
  TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY,
  TYPED_TEMPLATES_FILE_NAME,
);

export interface TemplateExtractorTypedTemplate {
  fragment: TsCodeFragment;
  exportName: string;
}

const TS_TEMPLATE = `
TPL_TEMPLATE_FRAGMENTS;

export const TPL_EXPORT_NAME = TPL_TEMPLATE_EXPORTS;
`;

/**
 * The typed templates file plugin is used to generate a file that exports
 * the templates as a typed object.
 */
export const typedTemplatesFilePlugin = createTemplateExtractorPlugin({
  name: 'typed-templates-file',
  pluginDependencies: [
    templatePathsPlugin,
    templateExtractorBarrelExportPlugin,
  ],
  getInstance: ({ context, api }) => {
    const barrelExportPlugin = context.getPlugin(
      templateExtractorBarrelExportPlugin.name,
    );
    const generatorTemplates = new Map<
      string,
      TemplateExtractorTypedTemplate[]
    >();

    function addTemplate(
      generatorName: string,
      template: TemplateExtractorTypedTemplate,
    ): void {
      const templates = generatorTemplates.get(generatorName) ?? [];
      templates.push(template);
      generatorTemplates.set(generatorName, templates);
    }

    api.registerHook('afterWrite', async () => {
      for (const [generatorName, templates] of generatorTemplates) {
        const templateExports = templates.map((t) => t.exportName);
        const templatesFragment = TsCodeUtils.mergeFragments(
          new Map(templates.map((t) => [t.exportName, t.fragment])),
          '\n\n',
        );
        const exportName = getGeneratedTemplateConstantName(
          generatorName,
          'TEMPLATES',
        );
        const templateFileContents = renderTsCodeFileTemplate({
          templateContents: TS_TEMPLATE,
          variables: {
            TPL_TEMPLATE_FRAGMENTS: templatesFragment,
            TPL_TEMPLATE_EXPORTS: `{ ${templateExports.join(', ')} }`,
            TPL_EXPORT_NAME: exportName,
          },
          options: {
            importSortOptions: {
              internalPatterns: [/^#src/],
            },
          },
        });
        const generatorPath =
          context.configLookup.getExtractorConfigOrThrow(
            generatorName,
          ).generatorDirectory;
        const typedTemplatesPath = posixJoin(
          generatorPath,
          TYPED_TEMPLATES_FILE_PATH,
        );
        await context.fileContainer.writeFile(
          typedTemplatesPath,
          templateFileContents,
        );

        barrelExportPlugin.addGeneratedBarrelExport(generatorName, {
          moduleSpecifier: `./${normalizeTsPathToJsPath(TYPED_TEMPLATES_FILE_NAME)}`,
          namedExport: exportName,
          name: 'templates',
        });
      }
    });

    return {
      addTemplate,
    };
  },
});
