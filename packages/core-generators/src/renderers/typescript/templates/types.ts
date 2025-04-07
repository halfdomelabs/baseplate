import { ProviderType } from '@halfdomelabs/sync';
import { TsCodeFragment } from '../fragments/types.js';
import { TsImportMapProvider } from '../import-maps/types.js';

export interface TsCodeTemplateVariable {
  description?: string;
}

export type TsCodeTemplateVariableMap = Record<string, TsCodeTemplateVariable>;

export type TsCodeFileTemplateSource =
  | {
      path: string;
    }
  | {
      contents: string;
    };

export interface TsCodeFileTemplate<
  TVariables extends TsCodeTemplateVariableMap,
  TImportMapProviders extends Record<string, ProviderType> = Record<
    never,
    ProviderType
  >,
> {
  name: string;
  variables: TVariables;
  source: TsCodeFileTemplateSource;
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

export type InferTsCodeTemplateVariablesFromMap<
  TMap extends TsCodeTemplateVariableMap,
> = {
  [T in keyof TMap]: TsCodeFragment | string;
};
