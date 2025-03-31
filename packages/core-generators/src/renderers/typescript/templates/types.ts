import { TsCodeFragment } from '../fragments/types.js';

export interface TsCodeTemplateVariable {
  description?: string;
}

export type TsCodeTemplateVariableMap = Record<string, TsCodeTemplateVariable>;

interface TsCodeFileTemplateBase<TVariables extends TsCodeTemplateVariableMap> {
  name: string;
  variables: TVariables;
  /**
   * The prefix to use for the template variables.
   * @default 'TPL_'
   */
  prefix?: string;
}

interface TsCodeFileTemplateWithPath<
  TVariables extends TsCodeTemplateVariableMap,
> extends TsCodeFileTemplateBase<TVariables> {
  path: string;
}

interface TsCodeFileTemplateWithContents<
  TVariables extends TsCodeTemplateVariableMap,
> extends TsCodeFileTemplateBase<TVariables> {
  contents: string;
}

export type TsCodeFileTemplate<TVariables extends TsCodeTemplateVariableMap> =
  | TsCodeFileTemplateWithPath<TVariables>
  | TsCodeFileTemplateWithContents<TVariables>;

export type InferTsCodeTemplateVariablesFromMap<
  TMap extends TsCodeTemplateVariableMap,
> = {
  [T in keyof TMap]: TsCodeFragment | string;
};
