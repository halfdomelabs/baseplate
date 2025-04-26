import type {
  BuilderAction,
  ProviderType,
  WriteFileOptions,
} from '@halfdomelabs/sync';

import { normalizePathToProjectPath } from '@halfdomelabs/sync';
import { mapValues } from 'es-toolkit';
import path from 'node:path';

import type { RenderTsCodeFileTemplateOptions } from '../renderers/file.js';
import type {
  InferImportMapProvidersFromProviderTypeMap,
  InferTsTemplateVariablesFromMap,
  TsTemplateFile,
  TsTemplateGroup,
} from '../templates/types.js';
import type { RenderTsTemplateFileActionInput } from './render-ts-template-file-action.js';

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

type IntersectionOfValues<T> = UnionToIntersection<T[keyof T]>;

// Helper type to convert a union to an intersection
type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Typescript hack to force IDEs to show raw object
 * type without additional typing that we have added
 */
type NormalizeTypes<T> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T]: T[K];
      }
    : T;

type InferImportMapProvidersFromTemplateGroup<T extends TsTemplateGroup> =
  NormalizeTypes<
    IntersectionOfValues<{
      [K in keyof T['templates']]: InferImportMapProvidersFromProviderTypeMap<
        T['templates'][K]['template']['importMapProviders']
      >;
    }>
  >;

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
    ? {
        importMapProviders?: never;
      }
    : { importMapProviders: InferImportMapProvidersFromTemplateGroup<T> });

/**
 * Extracts the template file inputs from a template group
 * @param input - The input for the template group
 * @returns The template file inputs
 */
export function extractTsTemplateFileInputsFromTemplateGroup<
  T extends TsTemplateGroup = TsTemplateGroup,
>({
  group,
  baseDirectory,
  variables,
  importMapProviders,
  writeOptions,
  renderOptions,
}: RenderTsTemplateGroupActionInput<T>): RenderTsTemplateFileActionInput[] {
  const fileActionInputs: RenderTsTemplateFileActionInput[] = [];
  const typedImportMapProviders =
    (importMapProviders as undefined | Record<string, ProviderType>) ?? {};

  for (const [key, templateEntry] of Object.entries(group.templates)) {
    const destination = path.join(
      normalizePathToProjectPath(baseDirectory),
      templateEntry.destination,
    );

    const templateSpecificProviders = templateEntry.template.importMapProviders
      ? mapValues(
          templateEntry.template.importMapProviders,
          (_, providerKey: string) => {
            if (!(providerKey in typedImportMapProviders)) {
              throw new Error(
                `Import map provider "${providerKey}" is not defined in the import map providers`,
              );
            }
            return typedImportMapProviders[providerKey];
          },
        )
      : undefined;

    const destinationDirectory = path.dirname(destination);
    fileActionInputs.push({
      template: templateEntry.template,
      destination,
      variables:
        variables && typeof variables === 'object'
          ? (variables[key as keyof typeof variables] as Record<never, string>)
          : undefined,
      writeOptions: writeOptions?.[key],
      importMapProviders: templateSpecificProviders,
      renderOptions: {
        ...renderOptions,
        resolveModule: (specifier) => {
          if (!renderOptions?.resolveModule) return specifier;
          return renderOptions.resolveModule(specifier, destinationDirectory);
        },
      },
    });
  }
  return fileActionInputs;
}

/**
 * Renders a template group to a builder action
 * @param input - The input for the template group
 * @returns The builder action
 */
export function renderTsTemplateGroupAction<
  T extends TsTemplateGroup = TsTemplateGroup,
>(input: RenderTsTemplateGroupActionInput<T>): BuilderAction {
  return {
    execute: async (builder) => {
      const fileActionInputs =
        extractTsTemplateFileInputsFromTemplateGroup(input);
      for (const fileActionInput of fileActionInputs) {
        try {
          await builder.apply(renderTsTemplateFileAction(fileActionInput));
        } catch (error) {
          throw new Error(
            `Failed to render template "${fileActionInput.template.name}": ${String(error)}`,
          );
        }
      }
    },
  };
}
