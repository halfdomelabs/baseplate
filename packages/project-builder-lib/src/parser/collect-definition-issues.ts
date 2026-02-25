import type { z } from 'zod';

import type { PluginSpecStore } from '#src/plugins/index.js';
import type { DefinitionIssue } from '#src/schema/creator/definition-issue-types.js';

import { definitionIssueCheckerSpec } from '#src/schema/creator/definition-issue-checker-spec.js';
import { definitionFieldIssueRegistry } from '#src/schema/creator/definition-issue-registry.js';

import { walkDataWithSchema } from './walk-data-with-schema.js';

/**
 * Issues partitioned by severity level.
 */
export interface PartitionedIssues {
  /** Issues that block saving */
  errors: DefinitionIssue[];
  /** Issues that allow saving but block syncing */
  warnings: DefinitionIssue[];
}

/**
 * Splits issues into errors (block save) and warnings (block sync only).
 */
export function partitionIssuesBySeverity(
  issues: DefinitionIssue[],
): PartitionedIssues {
  const errors: DefinitionIssue[] = [];
  const warnings: DefinitionIssue[] = [];
  for (const issue of issues) {
    if (issue.severity === 'error') {
      errors.push(issue);
    } else {
      warnings.push(issue);
    }
  }
  return { errors, warnings };
}

/**
 * Walks schema+data to collect issues from field-level issue checkers
 * registered via `withIssueChecker`.
 *
 * Field-level checkers operate on the local value at each schema node
 * without access to the full definition.
 */
export function collectFieldIssues(
  schema: z.ZodType,
  data: unknown,
): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];

  walkDataWithSchema(schema, data, [
    {
      visit(schemaNode, value, ctx) {
        const meta = definitionFieldIssueRegistry.get(schemaNode);
        if (meta) {
          for (const checker of meta.checkers) {
            const result = checker(value, { path: ctx.path });
            issues.push(...result);
          }
        }
        return undefined;
      },
    },
  ]);

  return issues;
}

/**
 * Collects all definition issues from both field-level and definition-level checkers.
 *
 * - Field-level checkers are registered on schema nodes via `withIssueChecker`
 *   and operate on local values.
 * - Definition-level checkers are registered via `definitionIssueCheckerSpec`
 *   and operate on the full project definition.
 *
 * Issues do not block saving but block syncing until resolved.
 */
export function collectDefinitionIssues(
  schema: z.ZodType,
  data: unknown,
  pluginStore: PluginSpecStore,
): DefinitionIssue[] {
  // Collect field-level issues from schema walk
  const issues = collectFieldIssues(schema, data);

  // Collect definition-level issues from plugin spec checkers
  const checkerSpec = pluginStore.use(definitionIssueCheckerSpec);
  for (const checker of checkerSpec.getAllCheckers().values()) {
    const result = checker(data);
    issues.push(...result);
  }

  return issues;
}
