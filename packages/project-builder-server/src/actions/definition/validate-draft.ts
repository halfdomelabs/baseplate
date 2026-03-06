import type {
  PartitionedIssues,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import {
  collectDefinitionIssues,
  partitionIssuesBySeverity,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const definitionIssueSchema = z.object({
  message: z.string().describe('Human-readable description of the issue.'),
  path: z
    .array(z.union([z.string(), z.number()]))
    .describe('Path in the definition where the issue originated.'),
  severity: z
    .enum(['error', 'warning'])
    .describe(
      "Issue severity: 'error' blocks the operation, 'warning' does not.",
    ),
});

/**
 * Validates a draft definition by collecting all definition issues
 * (both field-level and definition-level) and partitioning them by severity.
 */
export function validateDraftDefinition(
  draftDefinition: Record<string, unknown>,
  parserContext: SchemaParserContext,
): PartitionedIssues {
  const container = ProjectDefinitionContainer.fromSerializedConfig(
    draftDefinition,
    parserContext,
  );

  const issues = collectDefinitionIssues(
    container.schema,
    container.definition,
    container.pluginStore,
  );

  return partitionIssuesBySeverity(issues);
}
