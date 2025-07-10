import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';
import type { TemplateMetadataOptions } from '@baseplate-dev/sync';

/**
 * Creates template metadata options based on project definition settings.
 *
 * @param projectJson - The project definition containing template extractor settings
 * @returns Template metadata options or undefined if not enabled
 */
export function createTemplateMetadataOptions(
  projectJson: ProjectDefinition,
): TemplateMetadataOptions | undefined {
  if (!projectJson.settings.templateExtractor?.writeMetadata) {
    return undefined;
  }

  const fileIdRegexWhitelist =
    projectJson.settings.templateExtractor.fileIdRegexWhitelist.split('\n');

  const compiledPatterns = fileIdRegexWhitelist
    .filter((x) => x.trim() !== '')
    .map((pattern) => {
      try {
        return new RegExp(pattern);
      } catch (err) {
        console.warn(`Invalid regex pattern: ${pattern}`, err);
        return null;
      }
    })
    .filter((regex): regex is RegExp => regex !== null);

  return {
    includeTemplateMetadata: true,
    shouldGenerateMetadata: (context) => {
      // always write metadata for non-instance files
      if (!context.isInstance) return true;
      return compiledPatterns.some((regex) =>
        regex.test(`${context.generatorName}:${context.fileId}`),
      );
    },
  };
}
