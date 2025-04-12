import { Project } from 'ts-morph';

import type { TsTemplateFileMetadata } from '../templates/types.js';

const VARIABLE_REGEX =
  /\/\* TPL_([A-Z0-9_]+):START \*\/([\s\S]*?)\/\* TPL_\1:END \*\//g;
const HOISTED_REGEX =
  /\/\* HOISTED:([A-Za-z0-9_]+):START \*\/([\s\S]*?)\/\* HOISTED:\1:END \*\/\n?/g;

/**
 * Processes the raw content of a potential Typescript template file.
 * - Replaces TPL variable blocks with placeholders `TPL_VAR`.
 * - Removes HOISTED blocks.
 * - Uses ts-morph to remove unused imports/identifiers.
 * - Adds a `// @ts-nocheck` comment to the top of the file.
 *
 * @param content - The raw file content.
 * @returns The processed content.
 */
export function processTsTemplateContent(
  { variables }: TsTemplateFileMetadata,
  content: string,
): string {
  let processedContent = content;

  const templateVariables = new Set<string>(Object.keys(variables ?? {}));
  const processedVariables = new Set<string>();
  // Replace TPL variable blocks and extract variable names

  processedContent = processedContent.replaceAll(
    VARIABLE_REGEX,
    (match, varName: string) => {
      const fullName = `TPL_${varName}`;
      if (!templateVariables.has(fullName)) {
        throw new Error(`Found unknown template variable: ${fullName}`);
      }
      processedVariables.add(fullName);
      return fullName;
    },
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

  // Use ts-morph to clean up unused imports
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('temp.ts', processedContent);
  sourceFile.organizeImports();

  processedContent = sourceFile.getFullText();

  return `// @ts-nocheck\n\n${processedContent}`;
}
