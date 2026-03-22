import type { PluginSpecStore } from '#src/plugins/index.js';
import type {
  DefinitionExpression,
  ExpressionValidationContext,
} from '#src/references/expression-types.js';
import type { DefinitionIssue } from '#src/schema/creator/definition-issue-types.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

/**
 * Input for expression issue collection.
 * Satisfied by ProjectDefinitionContainer and by lightweight test fixtures.
 */
export interface CollectExpressionIssuesInput {
  definition: ProjectDefinition;
  pluginStore: PluginSpecStore;
  expressions: readonly DefinitionExpression[];
}

/**
 * Collects validation issues from expression parsers in the definition.
 *
 * Uses pre-resolved expressions to avoid redundant schema walks.
 * Each parser's `validate()` method is called with the expression value and
 * resolved slots. Warnings are mapped to `DefinitionIssue` objects.
 *
 * @param input - The definition, plugin store, and pre-resolved expressions
 * @returns Array of definition issues from expression validation
 */
export function collectExpressionIssues(
  input: CollectExpressionIssuesInput,
): DefinitionIssue[] {
  const { definition, pluginStore, expressions } = input;

  const context: ExpressionValidationContext = {
    definition,
    pluginStore,
  };

  const issues: DefinitionIssue[] = [];

  for (const expression of expressions) {
    try {
      const warnings = expression.parser.validate(
        expression.value,
        definition,
        context,
        expression.resolvedSlots,
      );

      for (const warning of warnings) {
        issues.push({
          message: warning.message,
          path: expression.path,
          severity: 'warning',
        });
      }
    } catch (error) {
      issues.push({
        message: `Expression parser "${expression.parser.name}" threw an error: ${error instanceof Error ? error.message : String(error)}`,
        path: expression.path,
        severity: 'warning',
      });
    }
  }

  return issues;
}
