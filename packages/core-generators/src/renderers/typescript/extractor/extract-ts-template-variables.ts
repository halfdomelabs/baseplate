import { sortObjectKeys } from '@halfdomelabs/utils';

import type { TsTemplateVariable } from '../templates/types.js';

import { preprocessCodeForExtractionHack } from './preprocess-code-for-extraction-hack.js';

const VARIABLE_REGEX =
  /\/\* TPL_([A-Z0-9_]+):START \*\/([\s\S]*?)\/\* TPL_\1:END \*\//g;
const TSX_VARIABLE_REGEX =
  /\{\/\* TPL_([A-Z0-9_]+):START \*\/\}([\s\S]*?)\{\/\* TPL_\1:END \*\/\}/g;
const COMMENT_VARIABLE_REGEX =
  /\/\* TPL_([A-Z0-9_]+):COMMENT:START \*\/([\s\S]*?)\/\* TPL_\1:COMMENT:END \*\//g;
const HOISTED_REGEX =
  /\/\* HOISTED:([A-Za-z0-9_-]+):START \*\/([\s\S]*?)\/\* HOISTED:\1:END \*\/\n?/g;

interface ExtractedTemplateVariables {
  content: string;
  variables: Record<string, TsTemplateVariable>;
}

/**
 * Extracts template variables from a Typescript template file and returns both the processed content
 * and the discovered variables.
 * - Replaces TPL variable blocks with placeholders `TPL_VAR`.
 * - Removes HOISTED blocks.
 * - Discovers all template variables used in the content.
 *
 * @param content - The raw file content.
 * @returns An object containing the processed content and discovered variables.
 */
export function extractTsTemplateVariables(
  content: string,
): ExtractedTemplateVariables {
  let processedContent = content;
  const discoveredVariables: Record<string, TsTemplateVariable> = {};

  // Preprocess the content to handle the extraction hack
  processedContent = preprocessCodeForExtractionHack(processedContent);

  // Extract and process TPL variable blocks
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

  // Remove HOISTED blocks
  processedContent = processedContent.replaceAll(HOISTED_REGEX, '');

  return {
    content: processedContent,
    variables: sortObjectKeys(discoveredVariables),
  };
}
