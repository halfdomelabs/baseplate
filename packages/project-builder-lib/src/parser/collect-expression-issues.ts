import type { z } from 'zod';

import type { PluginSpecStore } from '#src/plugins/index.js';
import type { ExpressionValidationContext } from '#src/references/expression-types.js';
import type { DefinitionIssue } from '#src/schema/creator/definition-issue-types.js';

import { extractDefinitionRefs } from '#src/references/extract-definition-refs.js';

/**
 * Collects validation issues from expression parsers registered on the schema.
 *
 * Walks the schema+data to find expression annotations, resolves their slots,
 * then calls each parser's `validate()` method. Warnings are mapped to
 * `DefinitionIssue` objects with warning severity.
 *
 * @param schema - The Zod schema to walk
 * @param data - The parsed definition data
 * @param pluginStore - The plugin spec store for validation context
 * @returns Array of definition issues from expression validation
 */
export function collectExpressionIssues(
  schema: z.ZodType,
  data: unknown,
  pluginStore: PluginSpecStore,
): DefinitionIssue[] {
  const refPayload = extractDefinitionRefs(schema, data);

  const context: ExpressionValidationContext = {
    definition: data,
    pluginStore,
  };

  const issues: DefinitionIssue[] = [];

  for (const expression of refPayload.expressions) {
    const warnings = expression.parser.validate(
      expression.value,
      data,
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
  }

  return issues;
}
