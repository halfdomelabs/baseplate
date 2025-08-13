import { sortObjectKeys } from '@baseplate-dev/utils';

import type { TsTemplateFileVariable } from '../templates/types.js';

import { applySimpleReplacements } from './apply-simple-replacements.js';
import { parseInlineReplacements } from './parse-inline-replacements.js';
import { preprocessCodeForExtractionHack } from './preprocess-code-for-extraction-hack.js';

const VARIABLE_REGEX =
  /\/\* TPL_([A-Z0-9_]+):START \*\/([\s\S]*?)\/\* TPL_\1:END \*\//g;
const TSX_VARIABLE_REGEX =
  /\{\/\* TPL_([A-Z0-9_]+):START \*\/\}([\s\S]*?)\{\/\* TPL_\1:END \*\/\}/g;
const COMMENT_VARIABLE_REGEX =
  /\/\* TPL_([A-Z0-9_]+):COMMENT:START \*\/([\s\S]*?)\/\* TPL_\1:COMMENT:END \*\//g;
const BLOCK_VARIABLE_REGEX = /\/\* TPL_([A-Z0-9_]+):BLOCK \*\//g;
const INLINE_VARIABLE_REGEX = /\/\* TPL_([A-Z0-9_]+):INLINE \*\//g;
const HOISTED_REGEX =
  /\/\* HOISTED:([A-Za-z0-9_-]+):START \*\/([\s\S]*?)\/\* HOISTED:\1:END \*\/\n?/g;

interface ExtractedTemplateVariables {
  content: string;
  variables: Record<string, TsTemplateFileVariable>;
}

/**
 * Extracts template variables from a TypeScript template file and returns both the processed content
 * and the discovered variables.
 * - Phase 1: Parses and applies inline replacement comments like TPL_VAR=value
 * - Phase 2: Replaces TPL variable blocks with placeholders `TPL_VAR`
 * - Removes HOISTED blocks
 * - Discovers all template variables used in the content
 *
 * @param content - The raw file content
 * @returns An object containing the processed content and discovered variables
 */
export function extractTsTemplateVariables(
  content: string,
): ExtractedTemplateVariables {
  let processedContent = content;
  const discoveredVariables: Record<string, TsTemplateFileVariable> = {};

  // Phase 1: Parse and apply inline replacement comments
  const { content: afterInlineReplacements, replacements } =
    parseInlineReplacements(content);

  processedContent = afterInlineReplacements;

  // Apply simple replacements if any were found
  if (Object.keys(replacements).length > 0) {
    processedContent = applySimpleReplacements(processedContent, replacements);

    // Track variables introduced by inline replacements
    for (const variable of Object.values(replacements)) {
      discoveredVariables[variable] = {
        type: 'replacement',
      };
    }
  }

  // Preprocess the content to handle the extraction hack
  processedContent = preprocessCodeForExtractionHack(processedContent);

  // Phase 2: Extract and process delimiter-based TPL variable blocks
  const processVariableBlock = (
    varName: string,
    formatName: (name: string) => string,
  ): string => {
    const fullName = `TPL_${varName}`;
    discoveredVariables[fullName] = {};
    return formatName(fullName);
  };

  processedContent = processedContent.replaceAll(
    TSX_VARIABLE_REGEX,
    (match: string, varName: string) =>
      processVariableBlock(varName, (name) => `<${name} />`),
  );
  processedContent = processedContent.replaceAll(
    VARIABLE_REGEX,
    (match: string, varName: string) =>
      processVariableBlock(varName, (name) => name),
  );
  processedContent = processedContent.replaceAll(
    COMMENT_VARIABLE_REGEX,
    (match: string, varName: string) =>
      processVariableBlock(varName, (name) => `/* ${name} */`),
  );

  // Process BLOCK and INLINE variable patterns
  processedContent = processedContent.replaceAll(
    BLOCK_VARIABLE_REGEX,
    (match: string, varName: string) =>
      processVariableBlock(varName, (name) => name),
  );
  processedContent = processedContent.replaceAll(
    INLINE_VARIABLE_REGEX,
    (match: string, varName: string) =>
      processVariableBlock(varName, (name) => name),
  );

  // Remove HOISTED blocks
  processedContent = processedContent.replaceAll(HOISTED_REGEX, '');

  return {
    content: processedContent,
    variables: sortObjectKeys(discoveredVariables),
  };
}
