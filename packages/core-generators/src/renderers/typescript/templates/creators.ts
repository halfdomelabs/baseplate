import { TsCodeTemplateVariableMap } from './types.js';

import { TsCodeFileTemplate } from './types.js';

export function tsCodeFileTemplate<
  TVariables extends TsCodeTemplateVariableMap,
>(template: TsCodeFileTemplate<TVariables>): TsCodeFileTemplate<TVariables> {
  return template;
}
