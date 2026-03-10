import type { z } from 'zod';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { DefinitionIssueChecker } from '#src/schema/creator/definition-issue-checker-spec.js';
import type { DefinitionIssue } from '#src/schema/creator/definition-issue-types.js';

import { definitionIssueCheckerSpec } from '#src/schema/creator/definition-issue-checker-spec.js';
import { definitionFieldIssueRegistry } from '#src/schema/creator/definition-issue-registry.js';

import { collectExpressionIssues } from './collect-expression-issues.js';
import { checkMutationRoles } from './definition-issue-checkers/mutation-roles-checker.js';
import { checkRelationTypeMismatch } from './definition-issue-checkers/relation-type-mismatch-checker.js';
import { walkDataWithSchema } from './walk-data-with-schema.js';

/**
 * Built-in definition-level checkers registered at runtime to avoid
 * circular dependencies between schema/creator/ and parser/.
 */
const BUILT_IN_CHECKERS: DefinitionIssueChecker[] = [
  checkRelationTypeMismatch,
  checkMutationRoles,
];

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
            const results = checker(value);
            for (const result of results) {
              const path = [...ctx.entityRelativePath, ...result.path];
              if (ctx.entityId) {
                issues.push({ ...result, entityId: ctx.entityId, path });
              } else {
                issues.push({ ...result, path });
              }
            }
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
 * Error-severity issues block saving; warning-severity issues allow saving but block syncing.
 */
export function collectDefinitionIssues(
  container: ProjectDefinitionContainer,
): DefinitionIssue[] {
  const { schema, definition, pluginStore } = container;

  // Collect field-level issues from schema walk
  const issues = collectFieldIssues(schema, definition);

  // Collect definition-level issues from built-in checkers
  for (const checker of BUILT_IN_CHECKERS) {
    const result = checker(container);
    issues.push(...result);
  }

  // Collect definition-level issues from plugin spec checkers
  const checkerSpec = pluginStore.use(definitionIssueCheckerSpec);
  for (const checker of checkerSpec.getAllCheckers().values()) {
    const result = checker(container);
    issues.push(...result);
  }

  // Collect expression validation issues
  const expressionIssues = collectExpressionIssues(
    schema,
    definition,
    pluginStore,
  );
  issues.push(...expressionIssues);

  return issues;
}
