import type { TsCodeFragment } from '../fragments/types.js';
import type {
  InferTsCodeTemplateVariablesFromMap,
  TsCodeTemplateVariableMap,
} from '../templates/types.js';

import { flattenImportsAndHoistedFragments } from '../fragments/utils.js';

export interface RenderTsTemplateOptions {
  /**
   * Whether to include metadata in the rendered template to allow reverse generation.
   */
  includeMetadata?: boolean;
  /**
   * The prefix to use for the template variables.
   */
  prefix?: string;
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
  const prefix = options.prefix ?? 'TPL_';

  if (
    Object.keys(variables).some(
      (key) => !/^[A-Z0-9_]+$/.test(key) || !key.startsWith(prefix),
    )
  ) {
    throw new Error(
      `Template variable keys must be uppercase alphanumeric and start with the prefix ${prefix}`,
    );
  }

  renderedTemplate = renderedTemplate.replaceAll(
    new RegExp(`${prefix}[A-Z0-9_]+(?=[^A-Z0-9_]|$)`, 'g'),
    (match) => {
      const key = match;
      if (!(key in variables)) {
        throw new Error(`Template variable not found: ${key}`);
      }

      const value = variables[key];
      const contents = typeof value === 'string' ? value : value.contents;

      return options.includeMetadata ? `/* ${key} */ ${contents}` : contents;
    },
  );

  const { imports, hoistedFragments } = flattenImportsAndHoistedFragments(
    Object.values(variables).filter((val) => typeof val !== 'string'),
  );

  return {
    contents: renderedTemplate,
    imports,
    hoistedFragments,
  };
}
