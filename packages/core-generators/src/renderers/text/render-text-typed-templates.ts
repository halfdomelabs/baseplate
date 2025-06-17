import type { TemplateExtractorTemplateEntry } from '@baseplate-dev/sync/extractor-v2';

import { quot, sortObjectKeys } from '@baseplate-dev/utils';
import { camelCase } from 'change-case';
import { groupBy } from 'es-toolkit';

import type { TemplateExtractorTypedTemplate } from '#src/renderers/extractor/plugins/typed-templates-file.js';

import { resolvePackagePathSpecifier } from '#src/renderers/extractor/utils/package-path-specifier.js';

import type { TextGeneratorTemplateMetadata } from './types.js';

import { tsImportBuilder } from '../typescript/imports/builder.js';
import { TsCodeUtils, tsTemplate } from '../typescript/utils/ts-code-utils.js';

interface RenderTextTypedTemplateContext {
  generatorPackageName: string;
}

function renderTextTypedTemplate(
  templatePath: string,
  metadata: TextGeneratorTemplateMetadata,
  { generatorPackageName }: RenderTextTypedTemplateContext,
): TemplateExtractorTypedTemplate {
  const exportName = camelCase(metadata.name);
  const createOptions = TsCodeUtils.mergeFragmentsAsObject({
    name: quot(metadata.name),
    group: metadata.group ? quot(metadata.group) : undefined,
    source: TsCodeUtils.templateWithImports([
      tsImportBuilder().default('path').from('node:path'),
    ])`{
      path: path.join(import.meta.dirname, '../templates/${templatePath}'),
    }`,
    fileOptions: JSON.stringify(sortObjectKeys(metadata.fileOptions)),
    variables: JSON.stringify(sortObjectKeys(metadata.variables ?? {})),
  });
  const fragment = TsCodeUtils.templateWithImports([
    tsImportBuilder(['createTextTemplateFile']).from(
      resolvePackagePathSpecifier(
        '@baseplate-dev/core-generators:src/renderers/text/types.ts',
        generatorPackageName,
      ),
    ),
  ])`const ${exportName} = createTextTemplateFile(${createOptions});`;

  return {
    fragment,
    exportName,
  };
}

function renderTextTypedTemplateGroup(
  groupName: string,
  templates: TemplateExtractorTemplateEntry<TextGeneratorTemplateMetadata>[],
  context: RenderTextTypedTemplateContext,
): TemplateExtractorTypedTemplate {
  const renderedTemplates = templates
    .map(({ path, config }) => renderTextTypedTemplate(path, config, context))
    .toSorted((a, b) => a.exportName.localeCompare(b.exportName));
  const exportName = `${camelCase(groupName)}Group`;

  return {
    fragment: TsCodeUtils.mergeFragmentsPresorted(
      [
        ...renderedTemplates.map(({ fragment }) => fragment),
        tsTemplate`export const ${exportName} = ${TsCodeUtils.mergeFragmentsAsObject(
          Object.fromEntries(
            renderedTemplates.map(({ exportName }) => [exportName, exportName]),
          ),
        )}`,
      ],
      '\n\n',
    ),
    exportName,
  };
}

export function renderTextTypedTemplates(
  templates: TemplateExtractorTemplateEntry<TextGeneratorTemplateMetadata>[],
  context: RenderTextTypedTemplateContext,
): TemplateExtractorTypedTemplate[] {
  const templatesWithGroup = templates.filter((t) => t.config.group);
  const templatesWithoutGroup = templates.filter((t) => !t.config.group);

  const templatesByGroup = groupBy(
    templatesWithGroup,
    (t) => t.config.group ?? '',
  );

  // Render the template groups
  const typedTemplateGroups = Object.entries(templatesByGroup).map(
    ([groupName, templates]) =>
      renderTextTypedTemplateGroup(groupName, templates, context),
  );

  const typedTemplates = templatesWithoutGroup.map((t) =>
    renderTextTypedTemplate(t.path, t.config, context),
  );

  return [...typedTemplateGroups, ...typedTemplates];
}
