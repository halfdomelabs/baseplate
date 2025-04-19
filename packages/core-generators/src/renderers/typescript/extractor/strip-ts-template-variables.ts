import type { TsTemplateFileMetadata } from '../templates/types.js';

import { preprocessCodeForExtractionHack } from './preprocess-code-for-extraction-hack.js';

const VARIABLE_REGEX =
  /\/\* TPL_([A-Z0-9_]+):START \*\/([\s\S]*?)\/\* TPL_\1:END \*\//g;
const TSX_VARIABLE_REGEX =
  /\{\/\* TPL_([A-Z0-9_]+):START \*\/\}([\s\S]*?)\{\/\* TPL_\1:END \*\/\}/g;
const HOISTED_REGEX =
  /\/\* HOISTED:([A-Za-z0-9_-]+):START \*\/([\s\S]*?)\/\* HOISTED:\1:END \*\/\n?/g;

/**
 * Strips the variables from a Typescript template file.
 * - Replaces TPL variable blocks with placeholders `TPL_VAR`.
 * - Removes HOISTED blocks.
 *
 * @param content - The raw file content.
 * @returns The content with variables stripped.
 */
export function stripTsTemplateVariables(
  { variables }: TsTemplateFileMetadata,
  content: string,
): string {
  let processedContent = content;

  // Preprocess the content to handle the extraction hack
  processedContent = preprocessCodeForExtractionHack(processedContent);

  const templateVariables = new Set<string>(Object.keys(variables ?? {}));
  const processedVariables = new Set<string>();

  // Replace TPL variable blocks and extract variable names
  const processVariableBlock = (varName: string, isTsx = false): string => {
    const fullName = `TPL_${varName}`;
    if (!templateVariables.has(fullName)) {
      throw new Error(`Found unknown template variable: ${fullName}`);
    }
    processedVariables.add(fullName);
    return isTsx ? `<${fullName} />` : fullName;
  };

  processedContent = processedContent.replaceAll(
    TSX_VARIABLE_REGEX,
    (match: string, varName: string) => processVariableBlock(varName, true),
  );
  processedContent = processedContent.replaceAll(
    VARIABLE_REGEX,
    (match: string, varName: string) => processVariableBlock(varName, false),
  );

  // Make sure all template variables are processed
  const missingVariables = [...templateVariables].filter(
    (v) => !processedVariables.has(v),
  );
  if (missingVariables.length > 0) {
    throw new Error(
      `The template is missing variables: ${missingVariables.join(', ')}`,
    );
  }

  // Remove HOISTED blocks
  processedContent = processedContent.replaceAll(HOISTED_REGEX, '');

  return processedContent;
}
