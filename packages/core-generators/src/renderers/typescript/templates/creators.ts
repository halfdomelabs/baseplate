import { ProviderType } from '@halfdomelabs/sync';
import { TsCodeTemplateVariableMap } from './types.js';

import { TsCodeFileTemplate } from './types.js';

/**
 * Create a code file template.
 * @param template - The template to create.
 * @returns The created code file template.
 */
export function tsCodeFileTemplate<
  TVariables extends TsCodeTemplateVariableMap,
  TImportProviders extends Record<string, ProviderType> = Record<
    never,
    ProviderType
  >,
>(
  template: TsCodeFileTemplate<TVariables, TImportProviders>,
): TsCodeFileTemplate<TVariables, TImportProviders> {
  return template;
}
