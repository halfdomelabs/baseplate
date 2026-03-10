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
 * Info about the role function context the cursor is inside.
 */
interface RoleFunctionContext {
  funcName: 'hasRole' | 'hasSomeRole';
  /** The relation name if cursor is in a nested call's string arg (e.g., 'todoList' in hasRole(model.todoList, '...')) */
  nestedRelationName: string | null;
}

/**
 * Check if the cursor is inside a hasRole() or hasSomeRole() call expression
 * within a string literal. Returns context about the call if found.
 */
function getRoleFunctionContext(
  context: CompletionContext,
): RoleFunctionContext | null {
  const { state, pos } = context;
  const tree = syntaxTree(state);

  // Walk up the tree from the cursor position
  let node = tree.resolveInner(pos, -1);

  // First, check if we're inside a String
  if (node.name !== 'String') {
    return null;
  }

  const stringNode = node;

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

      if (funcName !== 'hasRole' && funcName !== 'hasSomeRole') {
        return null;
      }

      // Check if this is a nested call by looking for a model.X argument before the string
      const nestedRelationName = extractNestedRelationName(
        state,
        node,
        stringNode,
      );

      return { funcName, nestedRelationName };
    }
  }

  return null;
}

/**
 * Extract the relation name from a nested hasRole/hasSomeRole call.
 * Returns the relation name if the call has a `model.X` first argument
 * and the cursor's string is NOT the first argument (i.e., it's the role arg).
 */
function extractNestedRelationName(
  state: { doc: { sliceString(from: number, to: number): string } },
  callNode: { firstChild: { to: number } | null },
  stringNode: { from: number },
): string | null {
  // Look at the text between the callee end and the string node
  // For `hasRole(model.todoList, '...')`, after callee "hasRole" we have "(model.todoList, '"
  const callee = callNode.firstChild;
  if (!callee) return null;

  const textBetween = state.doc.sliceString(callee.to, stringNode.from);

  // Match pattern: (model.relationName, followed by quote
  const match = /^\(\s*model\.(\w+)\s*,\s*['"]?$/.exec(textBetween);
  if (!match) {
    // Also match inside array: (model.relationName, ['
    const arrayMatch = /^\(\s*model\.(\w+)\s*,\s*\[?\s*['"]?$/.exec(
      textBetween,
    );
    if (!arrayMatch) return null;
    return arrayMatch[1];
  }
  return match[1];
}

/**
 * Info about a relation for autocomplete purposes.
 */
export interface RelationAutocompleteInfo {
  /** The relation name (e.g., 'todoList') */
  relationName: string;
  /** The foreign model name (e.g., 'TodoList') */
  foreignModelName: string;
  /** Role names defined on the foreign model's authorizer */
  foreignAuthorizerRoleNames: string[];
}

/**
 * Creates autocomplete for model and auth context using completionPath.
 *
 * This implementation uses CodeMirror's completionPath to determine what
 * the user is typing and provides completions accordingly:
 * - Top level: "model", "userId", "hasRole", "hasSomeRole", "true", "false"
 * - "model.": All model fields + relation names
 * - Inside hasRole('...'): All project roles
 * - Inside hasRole(model.relation, '...'): Foreign model's authorizer roles
 *
 * @param modelConfig - The model configuration for field completions
 * @param projectRoles - List of role names from project auth config
 * @param relationInfoList - List of relation autocomplete info for nested expressions
 * @see https://github.com/codemirror/lang-javascript#completionpath
 */
export function createAuthorizerCompletions(
  modelConfig: ModelConfig,
  projectRoles: string[],
  relationInfoList: RelationAutocompleteInfo[] = [],
): (context: CompletionContext) => CompletionResult | null {
  // Build scalar field completions (for general model.field contexts)
  const scalarFieldCompletions: Completion[] = [];
  for (const field of modelConfig.model.fields) {
    scalarFieldCompletions.push({
      label: field.name,
      type: 'property',
      detail: field.type,
    });
  }

  // Build relation completions (for hasRole/hasSomeRole first arg context)
  const relationCompletions: Completion[] = [];
  for (const rel of relationInfoList) {
    relationCompletions.push({
      label: rel.relationName,
      type: 'property',
      detail: `→ ${rel.foreignModelName}`,
      info: 'Relation (use with hasRole/hasSomeRole for nested authorization)',
    });
  }

  // Build a map of relation name → foreign authorizer role names for quick lookup
  const foreignRolesByRelation = new Map<string, string[]>();
  for (const rel of relationInfoList) {
    if (rel.foreignAuthorizerRoleNames.length > 0) {
      foreignRolesByRelation.set(
        rel.relationName,
        rel.foreignAuthorizerRoleNames,
      );
    }
  }

  // Top-level completions
  const topLevelCompletions: Completion[] = [
    {
      label: 'model',
      type: 'variable',
      info: 'The model instance being authorized',
    },
    {
      label: 'isAuthenticated',
      type: 'property',
      detail: 'boolean',
      info: 'Whether the user is authenticated',
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
      info: 'Check if user has a global auth role',
    }),
    snippetCompletion("hasSomeRole(['${role}'])", {
      label: 'hasSomeRole',
      type: 'method',
      detail: '(roles: string[]) => boolean',
      info: 'Check if user has any of the specified global auth roles',
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

  // Add nested hasRole/hasSomeRole snippets for each relation with authorizer roles
  for (const rel of relationInfoList) {
    if (rel.foreignAuthorizerRoleNames.length > 0) {
      topLevelCompletions.push(
        snippetCompletion(`hasRole(model.${rel.relationName}, '\${role}')`, {
          label: `hasRole(model.${rel.relationName})`,
          type: 'method',
          detail: `→ ${rel.foreignModelName} authorizer`,
          info: `Check if user has a role on the related ${rel.foreignModelName}`,
          boost: -1,
        }),
        snippetCompletion(
          `hasSomeRole(model.${rel.relationName}, ['\${role}'])`,
          {
            label: `hasSomeRole(model.${rel.relationName})`,
            type: 'method',
            detail: `→ ${rel.foreignModelName} authorizer`,
            info: `Check if user has any role on the related ${rel.foreignModelName}`,
            boost: -2,
          },
        ),
      );
    }
  }

  return (context: CompletionContext): CompletionResult | null => {
    // Check if we're inside hasRole() or hasSomeRole() string literals
    const roleFnContext = getRoleFunctionContext(context);
    if (roleFnContext) {
      // We're inside a string within hasRole() or hasSomeRole()
      // Find the start of the string content for autocomplete
      const { pos } = context;
      const tree = syntaxTree(context.state);
      const stringNode = tree.resolveInner(pos, -1);

      if (stringNode.name === 'String') {
        // Start autocomplete from the beginning of the string content (after the quote)
        const stringStart = stringNode.from + 1;

        // If this is a nested call, show foreign model's authorizer roles
        if (roleFnContext.nestedRelationName) {
          const foreignRoles = foreignRolesByRelation.get(
            roleFnContext.nestedRelationName,
          );
          if (foreignRoles && foreignRoles.length > 0) {
            return {
              from: stringStart,
              options: foreignRoles.map((role) => ({
                label: role,
                type: 'constant',
                info: `Role on ${relationInfoList.find((r) => r.relationName === roleFnContext.nestedRelationName)?.foreignModelName ?? 'related model'} authorizer`,
              })),
            };
          }
        }

        // Otherwise show project-level roles
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

      // Check if model. is inside hasRole( or hasSomeRole( as first arg — show relations only
      const textBefore = context.state.doc.sliceString(0, word.from);
      const isInsideRoleFnArg = /(?:hasRole|hasSomeRole)\(\s*$/.test(
        textBefore,
      );

      return {
        from: word.from + 6, // Length of "model."
        options: isInsideRoleFnArg
          ? relationCompletions
          : scalarFieldCompletions,
      };
    }

    // No completions for deeper paths
    return null;
  };
}
