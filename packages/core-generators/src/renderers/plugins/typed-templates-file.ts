import { createTemplateExtractorPlugin } from '@baseplate-dev/sync/extractor-v2';
import { posixJoin } from '@baseplate-dev/utils/node';
import { constantCase } from 'change-case';

import type { TsCodeFragment } from '../typescript/index.js';

import { renderTsCodeFileTemplate, TsCodeUtils } from '../typescript/index.js';
import { templatePathsPlugin } from './template-paths.js';

export const TYPED_TEMPLATES_FILE_PATH = 'generated/typed-templates.ts';

export interface TemplateExtractorTypedTemplate {
  fragment: TsCodeFragment;
  exportName: string;
}

const TS_TEMPLATE = `
TEMPLATE_FRAGMENTS;

export const EXPORT_NAME = TEMPLATE_EXPORTS;
`;

/**
 * The typed templates file plugin is used to generate a file that exports
 * the templates as a typed object.
 */
export const typedTemplatesFilePlugin = createTemplateExtractorPlugin({
  name: 'typed-templates-file',
  pluginDependencies: [templatePathsPlugin],
  getInstance: ({ context, api }) => {
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

    api.registerHook('afterWrite', () => {
      for (const [generatorName, templates] of generatorTemplates) {
        const templateExports = templates.map((t) => t.exportName);
        const templatesFragment = TsCodeUtils.mergeFragments(
          new Map(templates.map((t) => [t.exportName, t.fragment])),
        );
        const templateFileContents = renderTsCodeFileTemplate({
          templateContents: TS_TEMPLATE,
          variables: {
            TEMPLATE_FRAGMENTS: templatesFragment,
            TEMPLATE_EXPORTS: `{ ${templateExports.join(', ')} }`,
            TEMPLATE_NAME: `${constantCase(generatorName.split('#')[1])}_TEMPLATES`,
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
        context.fileContainer.writeFile(
          typedTemplatesPath,
          templateFileContents,
        );
      }
    });

    return {
      addTemplate,
    };
  },
});
