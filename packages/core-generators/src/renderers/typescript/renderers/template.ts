import type { TsCodeFragment } from '../fragments/types.js';
import type { TsTemplateFileVariableValue } from '../templates/types.js';

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

/**
 * Render a template to a code fragment.
 * @param template - The template to render.
 * @param variables - The variables to render the template with.
 * @param options - The options for the render.
 * @returns The rendered code fragment.
 */
export function renderTsTemplateToTsCodeFragment(
  template: string,
  variables: Record<string, TsTemplateFileVariableValue>,
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

  const variableKeys = new Set(Object.keys(variables));

  // find all block templates first
  const processedKeys = new Set<string>();
  if (options.includeMetadata) {
    renderedTemplate = renderedTemplate.replaceAll(
      new RegExp(`^(\\s*)(${prefix}[A-Z0-9_]+);$`, 'gm'),
      (match, leading: string, key: string) => {
        if (!(key in variables)) {
          throw new Error(`Template variable not found: ${key}`);
        }

        const value = variables[key];
        const contents = typeof value === 'string' ? value : value.contents;

        variableKeys.delete(key);
        processedKeys.add(key);
        return `${leading}/* ${key}:START */\n${contents}\n/* ${key}:END */`;
      },
    );
  }
  renderedTemplate = renderedTemplate.replaceAll(
    new RegExp(`(${prefix}[A-Z0-9_]+)(?=[^A-Z0-9_]|$)`, 'g'),
    (match, key: string) => {
      if (processedKeys.has(key)) {
        return match;
      }

      if (!(key in variables)) {
        throw new Error(`Template variable not found: ${key}`);
      }

      const value = variables[key];
      const contents = typeof value === 'string' ? value : value.contents;

      variableKeys.delete(key);

      return options.includeMetadata
        ? `/* ${key}:START */ ${contents} /* ${key}:END */`
        : contents;
    },
  );

  if (variableKeys.size > 0) {
    throw new Error(
      `Template variables were unused in template: ${[...variableKeys].join(', ')}`,
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
