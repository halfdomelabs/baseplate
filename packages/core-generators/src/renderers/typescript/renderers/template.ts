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
  const includeMetadata = options.includeMetadata ?? false;
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
  const blockMarkers = new Map<
    string,
    { key: string; leading: string; value: TsTemplateFileVariableValue }
  >();
  const inlineMarkers = new Map<
    string,
    { key: string; value: TsTemplateFileVariableValue }
  >();

  // --- Pass 1: Replace block placeholders with unique markers ---
  const blockRegex = new RegExp(`^([ \\t]*)(${prefix}[A-Z0-9_]+);$`, 'gm');
  renderedTemplate = renderedTemplate.replace(
    blockRegex,
    (match, leading: string, key: string) => {
      if (!(key in variables)) {
        throw new Error(`Template variable not found: ${key}`);
      }

      const marker = `__BLOCK_MARKER_${blockMarkers.size}__`; // Unique marker
      blockMarkers.set(marker, { key, leading, value: variables[key] });
      variableKeys.delete(key); // Mark as used

      return `${leading}${marker}`; // Replace with marker, preserving leading whitespace
    },
  );

  // --- Pass 2: Replace inline placeholders with unique markers ---
  // This regex ensures the TPL_ variable is not immediately followed by another valid variable character
  const inlineRegex = new RegExp(`(${prefix}[A-Z0-9_]+)(?![A-Z0-9_])`, 'g');
  renderedTemplate = renderedTemplate.replace(
    inlineRegex,
    (match, key: string) => {
      if (!(key in variables)) {
        throw new Error(`Template variable not found: ${key}`);
      }
      const marker = `__INLINE_MARKER_${inlineMarkers.size}__`; // Unique marker
      inlineMarkers.set(marker, { key, value: variables[key] });
      variableKeys.delete(key); // Mark as used

      return marker; // Replace with marker
    },
  );

  // --- Check for unused variables ---
  if (variableKeys.size > 0) {
    throw new Error(
      `Template variables were unused in template: ${[...variableKeys].join(', ')}`,
    );
  }

  // --- Pass 3: Resolve markers ---
  // Resolve block markers
  for (const [marker, { key, leading, value }] of blockMarkers.entries()) {
    const contents = typeof value === 'string' ? value : value.contents;
    const replacement = includeMetadata
      ? `${leading}/* ${key}:START */\n${contents}\n${leading}/* ${key}:END */` // Preserve indentation for end comment too
      : contents; // Note: leading whitespace is handled by the marker's position

    // Use replace instead of replaceAll as markers are unique
    renderedTemplate = renderedTemplate.replace(marker, replacement);
  }

  // Resolve inline markers
  for (const [marker, { key, value }] of inlineMarkers.entries()) {
    const contents = typeof value === 'string' ? value : value.contents;
    const replacement = includeMetadata
      ? `/* ${key}:START */ ${contents} /* ${key}:END */`
      : contents;

    // Use replace instead of replaceAll as markers are unique
    renderedTemplate = renderedTemplate.replace(marker, replacement);
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
