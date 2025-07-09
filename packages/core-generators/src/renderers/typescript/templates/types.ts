import {
  InferProviderType,
  ProviderType,
  TemplateFileBase,
  templateFileMetadataBaseSchema,
} from '@baseplate-dev/sync';
import { TsCodeFragment } from '../fragments/types.js';
import { z } from 'zod';
import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { templateConfigSchema } from '../../../../../sync/dist/templates/extractor/index.js';
import {
  TemplateFileOptions,
  templateFileOptionsSchema,
} from '#src/renderers/schemas/template-file-options.js';

export const TS_TEMPLATE_TYPE = 'ts';

const tsTemplateFileVariableSchema = z.object({});

const tsTemplateFileImportProviderSchema = z.object({
  importName: z.string(),
  packagePathSpecifier: z.string(),
});

export type TsTemplateFileImportProvider = z.infer<
  typeof tsTemplateFileImportProviderSchema
>;

const tsTemplateFileProjectExportSchema = z.object({
  /**
   * Whether the export is a type only export.
   */
  isTypeOnly: z.boolean().optional(),
  /**
   * The name this symbol is exported as from the module. Use `default` for default exports.
   *
   * Defaults to the key of the entry.
   */
  exportedAs: z.string().optional(),
});

export type TsTemplateFileProjectExport = z.infer<
  typeof tsTemplateFileProjectExportSchema
>;

export const tsTemplateMetadataSchema = templateConfigSchema.extend({
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
   * The exports of the file that are unique across the project.
   */
  projectExports: z
    .record(z.string(), tsTemplateFileProjectExportSchema)
    .optional(),
  /**
   * The import providers that will be used to resolve imports for the template.
   */
  importMapProviders: z
    .record(z.string(), tsTemplateFileImportProviderSchema)
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
});

export type TsTemplateMetadata = z.infer<typeof tsTemplateMetadataSchema>;

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
    { isTypeOnly?: boolean; exportedAs?: string }
  >;
  /**
   * The options for the template file
   */
  fileOptions: TemplateFileOptions;
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

/**
 * A group of text template files.
 */
export type TsTemplateGroup = Record<string, TsTemplateFile>;
