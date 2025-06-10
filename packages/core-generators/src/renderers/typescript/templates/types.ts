import {
  InferProviderType,
  ProviderType,
  TemplateFileBase,
  templateFileMetadataBaseSchema,
} from '@baseplate-dev/sync';
import { TsCodeFragment } from '../fragments/types.js';
import { z } from 'zod';
import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { templateConfigSchema } from '@baseplate-dev/sync/extractor-v2';
import { templateFileOptionsSchema } from '#src/renderers/schemas/template-file-options.js';

export const TS_TEMPLATE_TYPE = 'ts';

const tsTemplateFileVariableSchema = z.object({});

export const tsTemplateGeneratorTemplateMetadataSchema =
  templateConfigSchema.extend({
    /**
     * The options for the template file
     */
    fileOptions: templateFileOptionsSchema,
    /**
     * The path of the template relative to the closest file path root.
     */
    pathRootRelativePath: z.string().optional(),
    /**
     * The group to assign the template to when generating the typed templates.
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
    /**
     * The variables for the template.
     */
    variables: z.record(z.string(), tsTemplateFileVariableSchema).optional(),
    /**
     * The prefix to use for the template variables.
     * @default 'TPL_'
     */
    prefix: z.string().optional(),
    /**
     * Import map providers that will be used to resolve imports for the template.
     */
    importMapProviders: z.record(z.string(), z.any()).optional(),
  });

export const tsTemplateOutputTemplateMetadataSchema =
  templateFileMetadataBaseSchema.extend({
    type: z.literal(TS_TEMPLATE_TYPE),
    /**
     * The options for the template file
     */
    fileOptions: templateFileOptionsSchema,
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
     * Whether the template is only providing exports and we should not attempt to extract
     * the contents of the template.
     */
    projectExportsOnly: z.boolean().optional(),
  });

export type TsTemplateOutputTemplateMetadata = z.infer<
  typeof tsTemplateOutputTemplateMetadataSchema
>;

export interface TsTemplateFileVariable {}

export type TsTemplateVariableMap = Record<string, TsTemplateFileVariable>;

export interface TsTemplateFile<
  TVariables extends TsTemplateVariableMap = Record<
    never,
    TsTemplateFileVariable
  >,
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
  TVariables extends TsTemplateVariableMap = Record<
    never,
    TsTemplateFileVariable
  >,
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
