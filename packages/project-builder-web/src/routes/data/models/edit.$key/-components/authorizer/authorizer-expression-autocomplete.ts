import type { ModelConfig } from '@baseplate-dev/project-builder-lib';
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';

import { snippetCompletion } from '@codemirror/autocomplete';
import { completionPath } from '@codemirror/lang-javascript';
import { syntaxTree } from '@codemirror/language';

/**
 * Check if the cursor is inside a string literal by examining the syntax tree.
 * This uses CodeMirror's AST to accurately determine context.
 */
function isInsideStringLiteral(context: CompletionContext): boolean {
  const { state, pos } = context;
  const tree = syntaxTree(state);

  // Get the node at the cursor position
  const nodeBefore = tree.resolveInner(pos, -1);

  // Check if we're inside a String node
  return nodeBefore.name === 'String';
}

/**
 * Check if the cursor is inside a hasRole() or hasSomeRole() call expression
 * within a string literal. Returns the function name if found.
 */
function isInsideRoleFunction(
  context: CompletionContext,
): 'hasRole' | 'hasSomeRole' | null {
  const { state, pos } = context;
  const tree = syntaxTree(state);

  // Walk up the tree from the cursor position
  let node = tree.resolveInner(pos, -1);

  // First, check if we're inside a String
  if (node.name !== 'String') {
    return null;
  }

  // Walk up to find the CallExpression
  while (node.parent) {
    node = node.parent;

    // Found a CallExpression
    if (node.name === 'CallExpression') {
      // Get the function name (first child should be the callee)
      const callee = node.firstChild;
      if (!callee) return null;

      // Get the function name from the source
      const funcName = state.doc.sliceString(callee.from, callee.to);

      if (funcName === 'hasRole' || funcName === 'hasSomeRole') {
        return funcName;
      }

      // Not the function we're looking for
      return null;
    }
  }

  return null;
}

/**
 * Creates autocomplete for model and auth context using completionPath.
 *
 * This implementation uses CodeMirror's completionPath to determine what
 * the user is typing and provides completions accordingly:
 * - Top level: "model", "userId", "hasRole", "hasSomeRole", "true", "false"
 * - "model.": All model fields
 * - Inside hasRole('...'): All project roles
 *
 * @param modelConfig - The model configuration for field completions
 * @param projectRoles - List of role names from project auth config
 * @see https://github.com/codemirror/lang-javascript#completionpath
 */
export function createAuthorizerCompletions(
  modelConfig: ModelConfig,
  projectRoles: string[],
): (context: CompletionContext) => CompletionResult | null {
  // Build model field completions
  const modelFieldCompletions: Completion[] = [];
  for (const field of modelConfig.model.fields) {
    modelFieldCompletions.push({
      label: field.name,
      type: 'property',
      detail: field.type,
    });
  }

  // Top-level completions
  const topLevelCompletions: Completion[] = [
    {
      label: 'model',
      type: 'variable',
      info: 'The model instance being authorized',
    },
    {
      label: 'userId',
      type: 'property',
      detail: 'string | undefined',
      info: 'Current user ID',
    },
    snippetCompletion("hasRole('${user}')", {
      label: 'hasRole',
      type: 'method',
      detail: '(role: string) => boolean',
      info: 'Check if user has a specific role',
    }),
    snippetCompletion("hasSomeRole(['${user}'])", {
      label: 'hasSomeRole',
      type: 'method',
      detail: '(roles: string[]) => boolean',
      info: 'Check if user has any of the specified roles',
    }),
    {
      label: 'true',
      type: 'keyword',
    },
    {
      label: 'false',
      type: 'keyword',
    },
  ];

  return (context: CompletionContext): CompletionResult | null => {
    // Check if we're inside hasRole() or hasSomeRole() string literals
    const roleFunction = isInsideRoleFunction(context);
    if (roleFunction) {
      // We're inside a string within hasRole() or hasSomeRole()
      // Find the start of the string content for autocomplete
      const { state, pos } = context;
      const tree = syntaxTree(state);
      const stringNode = tree.resolveInner(pos, -1);

      if (stringNode.name === 'String') {
        // Start autocomplete from the beginning of the string content (after the quote)
        // String nodes include the quotes, so we add 1 to skip the opening quote
        const stringStart = stringNode.from + 1;

        return {
          from: stringStart,
          options: projectRoles.map((role) => ({
            label: role,
            type: 'constant',
            info: 'Role defined in project auth config',
          })),
        };
      }
    }

    const pathResult = completionPath(context);

    if (!pathResult) {
      // Top-level - require at least 1 character (not just whitespace)
      const word = context.matchBefore(/\w+/);
      if (!word) return null;

      // Don't show top-level completions inside string literals
      if (isInsideStringLiteral(context)) {
        return null;
      }

      return {
        from: word.from,
        options: topLevelCompletions,
      };
    }

    const { path } = pathResult;

    if (path.length === 0) {
      // Should not reach here due to check above, but keep for safety
      const word = context.matchBefore(/\w+/);
      if (!word) return null;

      // Don't show top-level completions inside string literals
      if (isInsideStringLiteral(context)) {
        return null;
      }

      return {
        from: word.from,
        options: topLevelCompletions,
      };
    }

    // Check if we're completing "model.*"
    if (path.length === 1 && path[0] === 'model') {
      // Allow completion immediately after dot (model.) or after typing characters (model.f)
      const word = context.matchBefore(/model\.\w*/);
      if (!word) return null;

      return {
        from: word.from + 6, // Length of "model."
        options: modelFieldCompletions,
      };
    }

    // No completions for deeper paths
    return null;
  };
}
