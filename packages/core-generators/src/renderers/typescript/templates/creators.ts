import { ProviderType } from '@baseplate-dev/sync';
import { TsTemplateVariableMap } from './types.js';

import { TsTemplateFile } from './types.js';

/**
 * Create a code file template.
 * @param template - The template to create.
 * @returns The created code file template.
 */
export function tsCodeFileTemplate<
  TVariables extends TsTemplateVariableMap,
  TImportProviders extends Record<string, ProviderType> = Record<
    never,
    ProviderType
  >,
>(
  template: TsTemplateFile<TVariables, TImportProviders>,
): TsTemplateFile<TVariables, TImportProviders> {
  return template;
}
