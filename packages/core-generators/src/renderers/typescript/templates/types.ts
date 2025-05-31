import {
  InferProviderType,
  ProviderType,
  TemplateFileBase,
  templateFileMetadataBaseSchema,
} from '@baseplate-dev/sync';
import { TsCodeFragment } from '../fragments/types.js';
import { z } from 'zod';
import { CASE_VALIDATORS } from '@baseplate-dev/utils';

export const TS_TEMPLATE_TYPE = 'ts';

export const tsTemplateFileMetadataSchema =
  templateFileMetadataBaseSchema.extend({
    type: z.literal(TS_TEMPLATE_TYPE),
    /**
     * The group of templates that this template belongs to.
     */
    group: CASE_VALIDATORS.KEBAB_CASE.optional(),
    /**
     * The name of the export group that this template belongs to. Export groups
     * allow you to group templates together that share the same import provider.
     */
    exportGroup: CASE_VALIDATORS.KEBAB_CASE.optional(),
    /**
     * The exports of the file that are unique across the project.
     */
    projectExports: z
      .record(
        z.string(),
        z.object({
          /**
           * Whether the export is a type only export.
           */
          isTypeOnly: z.boolean().optional(),
          /**
           * The exported name of the export within the file. Use 'default' for default exports.
           */
          exportName: z.string().optional(),
        }),
      )
      .optional(),
    /**
     * Whether the template is only exporting types and we should not attempt to extract
     * the contents of the template.
     */
    projectExportsOnly: z.boolean().optional(),
  });

export type TsTemplateFileMetadata = z.infer<
  typeof tsTemplateFileMetadataSchema
>;

export interface TsTemplateVariable {}

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
  /**
   * The exports of the file that are unique across the project.
   */
  projectExports?: Record<
    string,
    { isTypeOnly?: boolean; exportName?: string }
  >;
}

export type TsTemplateFileVariableValue = TsCodeFragment | string;

export type InferTsTemplateVariablesFromMap<
  TMap extends TsTemplateVariableMap,
> = {
  [T in keyof TMap]: TsTemplateFileVariableValue;
};

export type InferImportMapProvidersFromProviderTypeMap<
  T extends Record<string, ProviderType> | undefined,
> = Exclude<
  {
    [K in keyof T]: InferProviderType<T[K]>;
  },
  undefined
>;

export function createTsTemplateFile<
  TVariables extends TsTemplateVariableMap = Record<never, TsTemplateVariable>,
  TImportMapProviders extends Record<string, ProviderType> = Record<
    never,
    ProviderType
  >,
>(
  file: TsTemplateFile<TVariables, TImportMapProviders>,
): TsTemplateFile<TVariables, TImportMapProviders> {
  return file;
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
