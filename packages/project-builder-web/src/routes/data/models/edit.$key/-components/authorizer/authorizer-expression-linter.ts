import type { ProjectDefinitionContainer } from '@baseplate-dev/project-builder-lib';
import type { Diagnostic } from '@codemirror/lint';
import type { EditorView } from '@codemirror/view';

import {
  AuthorizerExpressionParseError,
  parseAuthorizerExpression,
  validateAuthorizerExpression,
} from '@baseplate-dev/project-builder-lib';

/**
 * Creates a linter function for authorizer expressions.
 *
 * Uses the existing expression parser and validator to:
 * - Parse the expression with Acorn
 * - Validate syntax and constructs
 * - Check model field references
 * - Check auth context references
 * - Warn about unknown role names
 *
 * @param modelContext - Model name and field names for validation
 * @param projectDef - Project definition container for role validation
 * @returns Linter function for CodeMirror
 */
export function createAuthorizerExpressionLinter(
  modelContext: {
    modelName: string;
    scalarFieldNames: Set<string>;
  } | null,
  projectDef: ProjectDefinitionContainer | null,
): (view: EditorView) => Diagnostic[] {
  return (view: EditorView): Diagnostic[] => {
    const code = view.state.doc.toString();
    if (!code.trim()) return [];

    const diagnostics: Diagnostic[] = [];

    try {
      // Parse the expression
      const parseResult = parseAuthorizerExpression(code);

      // Validate if we have context
      if (modelContext && projectDef) {
        const warnings = validateAuthorizerExpression(
          parseResult.ast,
          modelContext,
          projectDef,
        );

        // Convert warnings to diagnostics
        for (const warning of warnings) {
          let from = 0;
          let to = code.length;

          if (warning.start !== undefined) {
            from = warning.start;
          }
          if (warning.end !== undefined) {
            to = warning.end;
          }

          diagnostics.push({
            from,
            to,
            severity: 'warning',
            message: warning.message,
          });
        }
      }
    } catch (error) {
      // Parse error
      if (error instanceof AuthorizerExpressionParseError) {
        diagnostics.push({
          from: error.startPosition ?? 0,
          to: error.endPosition ?? code.length,
          severity: 'error',
          message: error.message,
        });
      } else if (error instanceof Error) {
        diagnostics.push({
          from: 0,
          to: code.length,
          severity: 'error',
          message: error.message,
        });
      }
    }

    return diagnostics;
  };
}
