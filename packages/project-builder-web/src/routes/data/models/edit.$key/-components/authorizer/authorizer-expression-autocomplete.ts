import type { ModelConfig } from '@baseplate-dev/project-builder-lib';
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';

import { snippetCompletion } from '@codemirror/autocomplete';
import { completionPath } from '@codemirror/lang-javascript';

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
    snippetCompletion("hasRole('${role}')", {
      label: 'hasRole',
      type: 'method',
      detail: '(role: string) => boolean',
      info: 'Check if user has a specific role',
    }),
    snippetCompletion("hasSomeRole(['${role}'])", {
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
    // Check if we're inside hasRole('...') or hasSomeRole(['...'])
    const insideHasRole = context.matchBefore(/hasRole\(['"](\w*)/);
    if (insideHasRole) {
      // Autocomplete role names inside hasRole() calls
      const roleStartPos = insideHasRole.from + 9; // Length of "hasRole('"

      return {
        from: roleStartPos,
        options: projectRoles.map((role) => ({
          label: role,
          type: 'constant',
          info: 'Role defined in project auth config',
        })),
      };
    }

    const pathResult = completionPath(context);

    if (!pathResult) {
      // Top-level - require at least 1 character (not just whitespace)
      const word = context.matchBefore(/\w+/);
      if (!word) return null;

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
