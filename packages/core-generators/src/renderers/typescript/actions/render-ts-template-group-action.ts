import {
  type BuilderAction,
  normalizePathToProjectPath,
  type WriteFileOptions,
} from '@halfdomelabs/sync';
import path from 'node:path';

import type { RenderTsCodeFileTemplateOptions } from '../renderers/file.js';
import type {
  InferImportMapProvidersFromProviderTypeMap,
  InferTsTemplateVariablesFromMap,
  TsTemplateFile,
  TsTemplateGroup,
} from '../templates/types.js';

import { renderTsTemplateFileAction } from './render-ts-template-file-action.js';

type HasVariables<T extends TsTemplateFile> =
  keyof InferTsTemplateVariablesFromMap<T['variables']> extends never
    ? false
    : true;

type InferTsTemplateVariablesFromTemplateGroup<T extends TsTemplateGroup> = {
  [K in keyof T['templates'] as HasVariables<
    T['templates'][K]['template']
  > extends true
    ? K
    : never]: InferTsTemplateVariablesFromMap<
    T['templates'][K]['template']['variables']
  >;
};

type HasImportMapProviders<T extends TsTemplateFile> =
  keyof InferImportMapProvidersFromProviderTypeMap<
    T['importMapProviders']
  > extends never
    ? false
    : true;

type InferImportMapProvidersFromTemplateGroup<T extends TsTemplateGroup> = {
  [K in keyof T['templates'] as HasImportMapProviders<
    T['templates'][K]['template']
  > extends true
    ? K
    : never]: InferImportMapProvidersFromProviderTypeMap<
    T['templates'][K]['template']['importMapProviders']
  >;
};

interface RenderTsTemplateGroupActionInputBase<T extends TsTemplateGroup> {
  group: T;
  baseDirectory: string;
  writeOptions?: {
    [K in keyof T['templates']]?: Omit<WriteFileOptions, 'templateMetadata'>;
  };
  renderOptions?: Omit<RenderTsCodeFileTemplateOptions, 'resolveModule'> & {
    resolveModule?: (
      moduleSpecifier: string,
      sourceDirectory: string,
    ) => string;
  };
}

export type RenderTsTemplateGroupActionInput<
  T extends TsTemplateGroup = TsTemplateGroup,
> = RenderTsTemplateGroupActionInputBase<T> &
  (keyof InferTsTemplateVariablesFromTemplateGroup<T> extends never
    ? Partial<{ variables: InferTsTemplateVariablesFromTemplateGroup<T> }>
    : { variables: InferTsTemplateVariablesFromTemplateGroup<T> }) &
  (keyof InferImportMapProvidersFromTemplateGroup<T> extends never
    ? Partial<{
        importMapProviders: InferImportMapProvidersFromTemplateGroup<T>;
      }>
    : { importMapProviders: InferImportMapProvidersFromTemplateGroup<T> });

export function renderTsTemplateGroupAction<
  T extends TsTemplateGroup = TsTemplateGroup,
>({
  group,
  baseDirectory,
  variables,
  importMapProviders,
  writeOptions,
  renderOptions,
}: RenderTsTemplateGroupActionInput<T>): BuilderAction {
  return {
    execute: async (builder) => {
      for (const [key, template] of Object.entries(group.templates)) {
        const destination = path.join(
          normalizePathToProjectPath(baseDirectory),
          template.destination,
        );

        try {
          const destinationDirectory = path.dirname(destination);
          await builder.apply(
            renderTsTemplateFileAction({
              template: template.template,
              destination,
              variables:
                variables && typeof variables === 'object'
                  ? (variables[key as keyof typeof variables] as Record<
                      never,
                      string
                    >)
                  : undefined,
              writeOptions: writeOptions?.[key],
              importMapProviders:
                importMapProviders && typeof importMapProviders === 'object'
                  ? (importMapProviders[
                      key as keyof typeof importMapProviders
                    ] as Record<never, string>)
                  : undefined,
              renderOptions: {
                ...renderOptions,
                resolveModule: (specifier) => {
                  if (!renderOptions?.resolveModule) return specifier;
                  return renderOptions.resolveModule(
                    specifier,
                    destinationDirectory,
                  );
                },
              },
            }),
          );
        } catch (error) {
          throw new Error(
            `Failed to render template "${key}": ${String(error)}`,
          );
        }
      }
    },
  };
}
