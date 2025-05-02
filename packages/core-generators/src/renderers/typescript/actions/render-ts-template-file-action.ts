import type {
  BuilderAction,
  GeneratorInfo,
  Provider,
  WriteFileOptions,
} from '@halfdomelabs/sync';

import {
  normalizePathToProjectPath,
  readTemplateFileSource,
} from '@halfdomelabs/sync';
import { differenceSet } from '@halfdomelabs/utils';
import { mapValues } from 'es-toolkit';

import type { RenderTsCodeFileTemplateOptions } from '../renderers/file.js';
import type {
  InferImportMapProvidersFromProviderTypeMap,
  InferTsTemplateVariablesFromMap,
  TsTemplateFile,
  TsTemplateFileMetadata,
  TsTemplateVariable,
} from '../templates/types.js';

import { renderTsCodeFileTemplate } from '../renderers/file.js';
import { TS_TEMPLATE_TYPE } from '../templates/types.js';

interface RenderTsTemplateFileActionInputBase<T extends TsTemplateFile> {
  template: T;
  id?: string;
  destination: string;
  writeOptions?: Omit<WriteFileOptions, 'templateMetadata'>;
  renderOptions?: Omit<
    RenderTsCodeFileTemplateOptions,
    'prefix' | 'includeMetadata'
  >;
  /**
   * Whether to include the metadata only if there's template metadata
   * already present.
   *
   * This is useful when the same template is used for many files and you
   * want to avoid having to generate metadata for every file.
   */
  includeMetadataOnDemand?: boolean;
  /**
   * The generator info for the generator that is writing the template file
   *
   * If not provided, it will be inferred from the builder.
   */
  generatorInfo?: GeneratorInfo;
}

type RenderTsTemplateFileActionVariablesInput<T extends TsTemplateFile> =
  keyof InferTsTemplateVariablesFromMap<T['variables']> extends never
    ? Partial<{ variables: InferTsTemplateVariablesFromMap<T['variables']> }>
    : { variables: InferTsTemplateVariablesFromMap<T['variables']> };

type RenderTsTemplateFileActionImportMapProvidersInput<
  T extends TsTemplateFile,
> = keyof Exclude<T['importMapProviders'], undefined> extends never
  ? Partial<{
      // Slightly awkward hack to force Typescript to enforce the keys for an empty import map providers object
      importMapProviders: Partial<Record<'', Provider>>;
    }>
  : {
      importMapProviders: InferImportMapProvidersFromProviderTypeMap<
        T['importMapProviders']
      >;
    };

export type RenderTsTemplateFileActionInput<
  T extends TsTemplateFile = TsTemplateFile,
> = RenderTsTemplateFileActionInputBase<T> &
  RenderTsTemplateFileActionVariablesInput<T> &
  RenderTsTemplateFileActionImportMapProvidersInput<T>;

export function renderTsTemplateFileAction<
  T extends TsTemplateFile = TsTemplateFile,
>({
  template,
  id,
  destination,
  writeOptions,
  variables,
  importMapProviders,
  renderOptions,
  includeMetadataOnDemand,
  generatorInfo: providedGeneratorInfo,
}: RenderTsTemplateFileActionInput<T>): BuilderAction {
  return {
    execute: async (builder) => {
      const generatorInfo = providedGeneratorInfo ?? builder.generatorInfo;
      const templateContents = await readTemplateFileSource(
        generatorInfo.baseDirectory,
        template.source,
      );
      const prefix = template.prefix ?? 'TPL_';
      const variableValues = variables ?? {};

      // make sure variables and template variables match keys
      const templateVariables = template.variables as Record<
        string,
        TsTemplateVariable
      >;
      const templateKeySet = new Set(Object.keys(templateVariables));
      const providedKeySet = new Set(Object.keys(variableValues));
      if (
        templateKeySet.size !== providedKeySet.size ||
        [...templateKeySet].some((k) => !providedKeySet.has(k))
      ) {
        const missingKeys = differenceSet(templateKeySet, providedKeySet);
        const extraKeys = differenceSet(providedKeySet, templateKeySet);
        throw new Error(
          `Template variables and provided variables do not match. Missing keys: ${[
            ...missingKeys,
          ].join(', ')}. Extra keys: ${[...extraKeys].join(', ')}.`,
        );
      }

      const templateMetadata: TsTemplateFileMetadata | undefined = {
        name: template.name,
        template:
          'path' in template.source
            ? template.source.path
            : 'content-only-template',
        generator: generatorInfo.name,
        group: template.group,
        type: TS_TEMPLATE_TYPE,
        variables:
          Object.keys(templateVariables).length > 0
            ? mapValues(templateVariables, (val) => ({
                description: val.description,
              }))
            : undefined,
        projectExports:
          Object.keys(template.projectExports ?? {}).length > 0
            ? template.projectExports
            : undefined,
      };

      const shouldIncludeMetadata =
        builder.metadataOptions.includeTemplateMetadata &&
        (!includeMetadataOnDemand ||
          builder.metadataOptions.hasTemplateMetadata?.(
            normalizePathToProjectPath(destination),
          ));

      const renderedTemplate = renderTsCodeFileTemplate(
        templateContents,
        variableValues,
        importMapProviders,
        {
          ...renderOptions,
          includeMetadata: shouldIncludeMetadata,
          prefix,
        },
      );

      builder.writeFile({
        id: id ?? template.name,
        destination,
        contents: renderedTemplate,
        options: writeOptions,
        templateMetadata: shouldIncludeMetadata ? templateMetadata : undefined,
        generatorName: generatorInfo.name,
      });
    },
  };
}
