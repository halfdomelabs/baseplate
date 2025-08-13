import type { TsCodeFragment } from '../fragments/types.js';
import type {
  TsTemplateFileVariable,
  TsTemplateFileVariableValue,
} from '../templates/types.js';

import { generateInlineReplacementComments } from '../extractor/parse-inline-replacements.js';
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
  /**
   * Optional metadata about variables (e.g., their type).
   */
  variableMetadata?: Record<string, TsTemplateFileVariable>;
}

/**
 * Escapes the replacement string to avoid conflicts with special replacement patterns.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement.
 *
 * @param replacement - The replacement string to escape.
 * @returns The escaped replacement string.
 */
function escapeReplacement(replacement: string): string {
  return replacement.replaceAll('$', '$$$$');
}

/**
 * Adds inline replacement comments to a template when metadata is enabled.
 *
 * @param template - The original template content
 * @param renderedTemplate - The template content after variable substitution
 * @param variables - The variables and their values
 * @param options - Rendering options including variableMetadata
 * @returns The template with inline replacement comments added
 */
export function addInlineReplacementComments(
  template: string,
  renderedTemplate: string,
  variables: Record<string, TsTemplateFileVariableValue>,
  options: RenderTsTemplateOptions,
): string {
  const { includeMetadata, variableMetadata } = options;

  // Only process if metadata is enabled and we have variable metadata
  if (!includeMetadata || !variableMetadata) {
    return renderedTemplate;
  }

  const replacementVariables: Record<string, string> = {};

  for (const [key, value] of Object.entries(variables)) {
    const metadata = variableMetadata[key];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (metadata?.type === 'replacement') {
      const contents = typeof value === 'string' ? value : value.contents;
      // Only add as replacement if it's a simple value
      if (contents && /^[a-zA-Z0-9_$/./-]+$/.test(contents)) {
        // Check for duplicate values which would prevent correct extraction
        if (contents in replacementVariables) {
          throw new Error(
            `Duplicate replacement value "${contents}" for ${key}. ` +
              `Value is already used for ${replacementVariables[contents]}. Each value must be unique when metadata is included.`,
          );
        }

        // Check if the value already exists in the template (would prevent extraction)
        // We check the original template, not the processed one
        const valuePattern = new RegExp(
          `\\b${contents.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}\\b`,
        );
        if (valuePattern.test(template)) {
          throw new Error(
            `The template contents contain the value "${contents}" which would prevent ` +
              'template extraction from working correctly. Please ensure that replacement variable values ' +
              'are not present in the original template file.',
          );
        }

        replacementVariables[contents] = key;
      }
    }
  }

  if (Object.keys(replacementVariables).length > 0) {
    const replacementComments =
      generateInlineReplacementComments(replacementVariables);

    // Find the position after imports to insert replacement comments
    const importEndPattern =
      /^((?:import\s+.*?;\n|import\s+.*?from\s+.*?;\n|\n)*)(.*)$/ms;
    const match = importEndPattern.exec(renderedTemplate);

    if (match) {
      const [, importsSection, restOfCode] = match;
      return `${importsSection}\n${replacementComments.join('\n')}\n\n${restOfCode}`;
    } else {
      // No imports found, add at the beginning
      return `${replacementComments.join('\n')}\n\n${renderedTemplate}`;
    }
  }

  return renderedTemplate;
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
  let renderedTemplate = template.replace(/^\/\/ @ts-nocheck\n/m, '');

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
  const tsxMarkers = new Map<
    string,
    { key: string; value: TsTemplateFileVariableValue }
  >();
  const commentMarkers = new Map<
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

  // --- Pass 2: Replace TSX placeholders with unique markers ---
  const tsxRegex = new RegExp(`<(${prefix}[A-Z0-9_]+) />`, 'g');
  renderedTemplate = renderedTemplate.replace(
    tsxRegex,
    (match, key: string) => {
      if (!(key in variables)) {
        throw new Error(`Template variable not found: ${key}`);
      }

      const marker = `__TSX_MARKER_${tsxMarkers.size}__`; // Unique marker
      tsxMarkers.set(marker, { key, value: variables[key] });
      variableKeys.delete(key); // Mark as used

      return marker; // Replace with marker, preserving leading whitespace
    },
  );

  // --- Pass 3: Replace comment placeholders with unique markers ---
  const commentRegex = new RegExp(`\\/\\* (${prefix}[A-Z0-9_]+) \\*\\/`, 'g');
  renderedTemplate = renderedTemplate.replace(
    commentRegex,
    (match, key: string) => {
      if (!(key in variables)) {
        throw new Error(`Template variable not found: ${key}`);
      }

      const marker = `__COMMENT_MARKER_${commentMarkers.size}__`; // Unique marker
      commentMarkers.set(marker, { key, value: variables[key] });
      variableKeys.delete(key); // Mark as used

      return marker; // Replace with marker
    },
  );

  // --- Pass 4: Replace inline placeholders with unique markers ---
  // This regex ensures the TPL_ variable is not immediately followed by another valid variable character
  const inlineRegex = new RegExp(`(${prefix}[A-Z0-9_]+)([^A-Z0-9_]|$)`, 'gm');
  renderedTemplate = renderedTemplate.replace(
    inlineRegex,
    (match, key: string, followingCharacter: string) => {
      if (!(key in variables)) {
        throw new Error(`Template variable not found: ${key}`);
      }
      // HACK: handle specific scenario where the variable is followed by a comma and the variable
      // value itself is an empty string which would result in invalid syntax, e.g. { TEST, } => { , }
      const value = variables[key];
      const contents = typeof value === 'string' ? value : value.contents;
      const shouldRemoveComma =
        followingCharacter === ',' && contents.trim() === '';

      const marker = `__INLINE_MARKER_${inlineMarkers.size}__`; // Unique marker
      inlineMarkers.set(marker, { key, value });
      variableKeys.delete(key); // Mark as used

      return `${marker}${shouldRemoveComma ? '' : followingCharacter}`; // Replace with marker
    },
  );

  // Workaround: Replace any whitespace around inline markers with parentheses with just the marker
  // e.g. ( \n __INLINE_MARKER_0__  \n ) => (__INLINE_MARKER_0__)
  renderedTemplate = renderedTemplate.replaceAll(
    /\((\s*)(__INLINE_MARKER_\d+__)(\s*)\)/g,
    (match, beforeWhitespace: string, marker: string) => `(${marker})`,
  );

  // --- Check for unused variables ---
  if (variableKeys.size > 0) {
    throw new Error(
      `Template variables were unused in template: ${[...variableKeys].join(', ')}`,
    );
  }

  // --- Pass 5: Resolve markers ---
  // Resolve block markers
  for (const [marker, { key, leading, value }] of blockMarkers.entries()) {
    const contents = typeof value === 'string' ? value : value.contents;
    const replacement = includeMetadata
      ? contents.trim() === ''
        ? `${leading}/* ${key}:BLOCK */`
        : `${leading}/* ${key}:START */\n${contents}\n${leading}/* ${key}:END */` // Preserve indentation for end comment too
      : contents; // Note: leading whitespace is handled by the marker's position

    // Use replace instead of replaceAll as markers are unique
    renderedTemplate = renderedTemplate.replace(
      marker,
      escapeReplacement(replacement),
    );
  }

  // Resolve TSX markers
  for (const [marker, { key, value }] of tsxMarkers.entries()) {
    const contents = typeof value === 'string' ? value : value.contents;
    const replacement = includeMetadata
      ? `{/* ${key}:START */}\n${contents}\n{/* ${key}:END */}`
      : contents;

    // Use replace instead of replaceAll as markers are unique
    renderedTemplate = renderedTemplate.replace(
      marker,
      escapeReplacement(replacement),
    );
  }

  // Resolve comment markers
  for (const [marker, { key, value }] of commentMarkers.entries()) {
    const contents = typeof value === 'string' ? value : value.contents;
    const replacement = includeMetadata
      ? `/* ${key}:COMMENT:START */\n${contents}\n/* ${key}:COMMENT:END */`
      : contents;

    // Use replace instead of replaceAll as markers are unique
    renderedTemplate = renderedTemplate.replace(
      marker,
      escapeReplacement(replacement),
    );
  }

  // Resolve inline markers
  for (const [marker, { key, value }] of inlineMarkers.entries()) {
    const contents = typeof value === 'string' ? value : value.contents;
    // Check if this is a replacement variable (should be rendered as plain value)
    const isReplacement =
      options.variableMetadata?.[key]?.type === 'replacement';

    const replacement =
      includeMetadata && !isReplacement
        ? contents.trim() === ''
          ? `/* ${key}:INLINE */`
          : `/* ${key}:START */ ${contents.trim()} /* ${key}:END */`
        : contents;

    // Use replace instead of replaceAll as markers are unique
    renderedTemplate = renderedTemplate.replace(
      marker,
      escapeReplacement(replacement),
    );
  }

  const { imports, hoistedFragments } = flattenImportsAndHoistedFragments(
    Object.values(variables).filter((val) => typeof val !== 'string'),
  );

  // Add inline replacement comments if needed
  renderedTemplate = addInlineReplacementComments(
    template,
    renderedTemplate,
    variables,
    options,
  );

  return {
    contents: renderedTemplate,
    imports,
    hoistedFragments,
  };
}
