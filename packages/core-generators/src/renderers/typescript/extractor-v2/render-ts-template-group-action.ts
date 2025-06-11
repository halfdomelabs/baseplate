import type {
  BuilderAction,
  ProviderType,
  WriteFileOptions,
} from '@baseplate-dev/sync';

import { normalizePathToProjectPath } from '@baseplate-dev/sync';
import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import { mapValues } from 'es-toolkit';
import path from 'node:path';

import type { RenderTsCodeFileTemplateOptions } from '../renderers/file.js';
import type {
  InferImportMapProvidersFromProviderTypeMap,
  InferTsTemplateVariablesFromMap,
  TsTemplateFile,
} from '../templates/types.js';

import { renderTsTemplateFileAction } from '../actions/render-ts-template-file-action.js';

type TsTemplateGroup = Record<string, TsTemplateFile>;

type HasVariables<T extends TsTemplateFile> =
  keyof InferTsTemplateVariablesFromMap<T['variables']> extends never
    ? false
    : true;

type InferTsTemplateVariablesFromTemplateGroup<T extends TsTemplateGroup> = {
  [K in keyof T as HasVariables<T[K]> extends true
    ? K
    : never]: InferTsTemplateVariablesFromMap<T[K]['variables']>;
};

type IntersectionOfValues<T> = UnionToIntersection<T[keyof T]>;

// Helper type to convert a union to an intersection
type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type InferImportMapProvidersFromTemplateGroup<T extends TsTemplateGroup> =
  IntersectionOfValues<{
    [K in keyof T]: InferImportMapProvidersFromProviderTypeMap<
      T[K]['importMapProviders']
    >;
  }>;

interface RenderTsTemplateGroupActionInputBase<T extends TsTemplateGroup> {
  group: T;
  paths: {
    [K in keyof T]: string;
  };
  options?: {
    [K in keyof T]?: Omit<WriteFileOptions, 'templateMetadata'>;
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
    ? {
        importMapProviders?: never;
      }
    : { importMapProviders: InferImportMapProvidersFromTemplateGroup<T> });

export function renderTsTemplateGroupAction<
  T extends TsTemplateGroup = TsTemplateGroup,
>({
  group,
  paths,
  variables,
  options,
  importMapProviders,
  renderOptions,
}: RenderTsTemplateGroupActionInput<T>): BuilderAction {
  return {
    execute: async (builder) => {
      const typedImportMapProviders =
        (importMapProviders as undefined | Record<string, ProviderType>) ?? {};

      for (const [key, template] of Object.entries(group)) {
        const destination = paths[key];

        // Handle template-specific import map providers
        const templateSpecificProviders = template.importMapProviders
          ? mapValues(template.importMapProviders, (_, providerKey: string) => {
              if (!(providerKey in typedImportMapProviders)) {
                throw new Error(
                  `Import map provider "${providerKey}" is not defined in the import map providers`,
                );
              }
              return typedImportMapProviders[providerKey];
            })
          : undefined;

        // Calculate destination directory for resolveModule
        const destinationDirectory = path.dirname(
          normalizePathToProjectPath(destination),
        );

        try {
          await builder.apply(
            renderTsTemplateFileAction({
              template,
              destination,
              variables:
                variables && typeof variables === 'object'
                  ? (variables[key as keyof typeof variables] as Record<
                      never,
                      string
                    >)
                  : undefined,
              writeOptions: options?.[key],
              importMapProviders: templateSpecificProviders,
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
          throw enhanceErrorWithContext(
            error,
            `Failed to render template "${key}"`,
          );
        }
      }
    },
  };
}
