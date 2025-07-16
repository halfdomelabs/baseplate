import type { TemplateExtractorTemplateEntry } from '@baseplate-dev/sync';

import { quot, sortObjectKeys } from '@baseplate-dev/utils';
import { camelCase } from 'change-case';
import { groupBy } from 'es-toolkit';

import type { TemplateExtractorTypedTemplate } from '#src/renderers/extractor/plugins/typed-templates-file.js';

import { resolvePackagePathSpecifier } from '#src/renderers/extractor/utils/package-path-specifier.js';

import type { TsTemplateMetadata } from '../templates/types.js';

import { tsImportBuilder } from '../imports/builder.js';
import { TsCodeUtils, tsTemplate } from '../utils/ts-code-utils.js';

interface RenderTsTypedTemplateContext {
  generatorPackageName: string;
}

function renderTsTypedTemplate(
  templateName: string,
  metadata: TsTemplateMetadata,
  { generatorPackageName }: RenderTsTypedTemplateContext,
): TemplateExtractorTypedTemplate {
  const exportName = camelCase(templateName);
  const templatePath = metadata.sourceFile;
  const createOptions = TsCodeUtils.mergeFragmentsAsObject({
    name: quot(templateName),
    group: metadata.group ? quot(metadata.group) : undefined,
    source: metadata.projectExportsOnly
      ? `{ contents: '' }`
      : TsCodeUtils.templateWithImports([
          tsImportBuilder().default('path').from('node:path'),
        ])`{
      path: path.join(import.meta.dirname, '../templates/${templatePath}'),
    }`,
    fileOptions: JSON.stringify(sortObjectKeys(metadata.fileOptions)),
    projectExports: JSON.stringify(metadata.projectExports),
    variables: JSON.stringify(sortObjectKeys(metadata.variables ?? {})),
    importMapProviders:
      metadata.importMapProviders &&
      TsCodeUtils.mergeFragmentsAsObject(
        Object.fromEntries(
          Object.entries(metadata.importMapProviders).map(
            ([key, importMapProvider]) => [
              key.replace(/Provider$/, ''),
              TsCodeUtils.importFragment(
                importMapProvider.importName,
                resolvePackagePathSpecifier(
                  importMapProvider.packagePathSpecifier,
                  generatorPackageName,
                ),
              ),
            ],
          ),
        ),
      ),
    referencedGeneratorTemplates: metadata.referencedGeneratorTemplates
      ? JSON.stringify(
          Object.fromEntries(
            metadata.referencedGeneratorTemplates.map((key) => [
              camelCase(key),
              {},
            ]),
          ),
        )
      : undefined,
    projectExportsOnly: metadata.projectExportsOnly ? 'true' : undefined,
  });
  const fragment = TsCodeUtils.templateWithImports([
    tsImportBuilder(['createTsTemplateFile']).from(
      resolvePackagePathSpecifier(
        '@baseplate-dev/core-generators:src/renderers/typescript/templates/types.ts',
        generatorPackageName,
      ),
    ),
  ])`const ${exportName} = createTsTemplateFile(${createOptions});`;

  return {
    fragment,
    exportName,
  };
}

function renderTsTypedTemplateGroup(
  groupName: string,
  templates: TemplateExtractorTemplateEntry<TsTemplateMetadata>[],
  context: RenderTsTypedTemplateContext,
): TemplateExtractorTypedTemplate {
  const renderedTemplates = templates
    .map(({ name, config }) => renderTsTypedTemplate(name, config, context))
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

export function renderTsTypedTemplates(
  templates: TemplateExtractorTemplateEntry<TsTemplateMetadata>[],
  context: RenderTsTypedTemplateContext,
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
      renderTsTypedTemplateGroup(groupName, templates, context),
  );

  const typedTemplates = templatesWithoutGroup.map((t) =>
    renderTsTypedTemplate(t.name, t.config, context),
  );

  return [...typedTemplateGroups, ...typedTemplates];
}
