import type { TsCodeFragment } from '../fragments/types.js';
import type {
  InferTsCodeTemplateVariablesFromMap,
  TsCodeTemplateVariableMap,
} from '../templates/types.js';

import { flattenImportsAndHoistedFragments } from '../fragments/utils.js';

export interface RenderTsTemplateOptions {
  includeMetadata?: boolean;
}

function validateKey(key: string): void {
  if (!/^[A-Z0-9_]+$/.test(key)) {
    throw new Error(`Invalid template file variable key: ${key}`);
  }
}

export function renderTsTemplateToTsCodeFragment<
  TVariables extends TsCodeTemplateVariableMap,
>(
  template: string,
  variables: InferTsCodeTemplateVariablesFromMap<TVariables>,
  options: RenderTsTemplateOptions = {},
): TsCodeFragment {
  // strip any ts-nocheck from header
  let renderedTemplate = template.replace(/^\/\/ @ts-nocheck\n/, '');
  // Replace variables with their values
  for (const [key, value] of Object.entries(variables)) {
    validateKey(key);
    const contents = typeof value === 'string' ? value : value.contents;

    const valueToReplace = options.includeMetadata
      ? `/* ${key} */ ${contents}`
      : contents;
    renderedTemplate = renderedTemplate.replaceAll(
      new RegExp(`${key}(?=[^A-Z0-9_]|$)`, 'g'),
      valueToReplace,
    );
  }

  const { imports, hoistedFragments } = flattenImportsAndHoistedFragments(
    Object.values(variables).filter((val) => typeof val !== 'string'),
  );

  return {
    contents: renderedTemplate,
    imports,
    hoistedFragments,
  };
}
