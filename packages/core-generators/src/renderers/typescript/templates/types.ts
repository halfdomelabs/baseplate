import {
  ProviderType,
  TemplateFileBase,
  templateFileMetadataBaseSchema,
} from '@halfdomelabs/sync';
import { TsCodeFragment } from '../fragments/types.js';
import { z } from 'zod';

export const TS_TEMPLATE_TYPE = 'ts';

export const tsTemplateFileMetadataSchema =
  templateFileMetadataBaseSchema.extend({
    type: z.literal(TS_TEMPLATE_TYPE),
    /**
     * The group of templates that this template belongs to.
     */
    group: z.string().optional(),
    /**
     * The variables for the template.
     */
    variables: z
      .record(
        z.string(),
        z.object({
          description: z.string().optional(),
        }),
      )
      .optional(),
  });

export type TsTemplateFileMetadata = z.infer<
  typeof tsTemplateFileMetadataSchema
>;

export interface TsTemplateVariable {
  description?: string;
}

export type TsTemplateVariableMap = Record<string, TsTemplateVariable>;

export interface TsTemplateFile<
  TVariables extends TsTemplateVariableMap = Record<never, TsTemplateVariable>,
  TImportMapProviders extends Record<string, ProviderType> = Record<
    never,
    ProviderType
  >,
> extends TemplateFileBase {
  /**
   * The variables for the template.
   */
  variables: TVariables;
  /**
   * The prefix to use for the template variables.
   * @default 'TPL_'
   */
  prefix?: string;
  /**
   * Import map providers that will be used to resolve imports for the template.
   */
  importMapProviders?: TImportMapProviders;
}

export type TsTemplateFileVariableValue = TsCodeFragment | string;

export type InferTsTemplateVariablesFromMap<
  TMap extends TsTemplateVariableMap,
> = {
  [T in keyof TMap]: TsTemplateFileVariableValue;
};

export function createTsTemplateFile<
  TVariables extends TsTemplateVariableMap = Record<never, TsTemplateVariable>,
  TImportMapProviders extends Record<string, ProviderType> = Record<
    never,
    ProviderType
  >,
>({
  name,
  source,
  variables = {} as TVariables,
  prefix,
  importMapProviders,
}: {
  name: string;
  source: { path: string } | { contents: string };
  variables?: TVariables;
  prefix?: string;
  importMapProviders?: TImportMapProviders;
}): TsTemplateFile<TVariables, TImportMapProviders> {
  return {
    name,
    source,
    variables,
    prefix,
    importMapProviders,
  };
}

interface TsTemplateGroupEntry {
  destination: string;
  template: TsTemplateFile;
}

/**
 * A group of text template files.
 */
export interface TsTemplateGroup<
  T extends Record<string, TsTemplateGroupEntry> = Record<
    string,
    TsTemplateGroupEntry
  >,
> {
  /**
   * The templates in the group.
   */
  templates: T;
}

export function createTsTemplateGroup<
  T extends Record<string, TsTemplateGroupEntry>,
>(group: TsTemplateGroup<T>): TsTemplateGroup<T> {
  return group;
}
