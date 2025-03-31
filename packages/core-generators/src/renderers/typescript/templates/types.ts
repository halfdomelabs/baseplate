import { TsCodeFragment } from '../fragments/types.js';

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
> {
  name: string;
  variables: TVariables;
  source: TsCodeFileTemplateSource;
  /**
   * The prefix to use for the template variables.
   * @default 'TPL_'
   */
  prefix?: string;
}

export type InferTsCodeTemplateVariablesFromMap<
  TMap extends TsCodeTemplateVariableMap,
> = {
  [T in keyof TMap]: TsCodeFragment | string;
};
