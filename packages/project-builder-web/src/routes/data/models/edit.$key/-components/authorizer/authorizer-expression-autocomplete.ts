import type { ModelConfig } from '@baseplate-dev/project-builder-lib';
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';

import { snippetCompletion } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

// ---------------------------------------------------------------------------
// Context resolution — testable independently of completion building
// ---------------------------------------------------------------------------

/**
 * Discriminated union describing the autocomplete context at a cursor position.
 */
export type ExpressionCompletionContext =
  | { type: 'topLevel' }
  | { type: 'modelField' }
  | { type: 'modelRelation' }
  | { type: 'roleString'; nestedRelationName: string | null }
  | { type: 'conditionKey'; relationName: string }
  | { type: 'conditionValue'; relationName: string }
  | { type: 'none' };

/**
 * Determine the autocomplete context for a cursor position in an authorizer expression.
 *
 * Uses CodeMirror's syntax tree and text analysis to classify what kind of
 * completion the user needs at the given position.
 */
export function resolveExpressionCompletionContext(
  state: CompletionContext['state'],
  pos: number,
): ExpressionCompletionContext {
  const tree = syntaxTree(state);
  const nodeBefore = tree.resolveInner(pos, -1);

  // 1. Check if cursor is inside a string within hasRole/hasSomeRole
  if (nodeBefore.name === 'String') {
    const roleCtx = detectRoleStringContext(state, nodeBefore);
    if (roleCtx) {
      return roleCtx;
    }
  }

  // 2. Check if cursor is inside exists/all conditions object
  const textBeforeCursor = state.doc.sliceString(0, pos);
  const conditionCtx = detectConditionContext(textBeforeCursor);
  if (conditionCtx) {
    return conditionCtx;
  }

  // 3. Check if cursor is completing model.* (via completionPath)
  const modelCtx = detectModelPathContext(state, pos);
  if (modelCtx) {
    return modelCtx;
  }

  // 4. Check for top-level identifier
  // Look for a word being typed that isn't inside a string
  const lineText = state.doc.sliceString(state.doc.lineAt(pos).from, pos);
  if (/\w+$/.test(lineText) && nodeBefore.name !== 'String') {
    return { type: 'topLevel' };
  }

  return { type: 'none' };
}

/**
 * Detect if cursor is inside a role string argument of hasRole/hasSomeRole.
 */
function detectRoleStringContext(
  state: CompletionContext['state'],
  stringNode: ReturnType<ReturnType<typeof syntaxTree>['resolveInner']>,
): ExpressionCompletionContext | null {
  // Walk up to find the CallExpression
  let node = stringNode;
  while (node.parent) {
    node = node.parent;

    if (node.name === 'CallExpression') {
      const callee = node.firstChild;
      if (!callee) return null;

      const funcName = state.doc.sliceString(callee.from, callee.to);
      if (funcName !== 'hasRole' && funcName !== 'hasSomeRole') {
        return null;
      }

      // Check for nested call: hasRole(model.X, '...')
      const textBetween = state.doc.sliceString(callee.to, stringNode.from);
      const nestedRelationName = extractNestedRelationName(textBetween);

      return { type: 'roleString', nestedRelationName };
    }
  }

  return null;
}

/**
 * Extract the relation name from a nested hasRole/hasSomeRole call.
 * Looks at text between the callee and the string node for a `model.X` pattern.
 */
function extractNestedRelationName(textBetween: string): string | null {
  // Match pattern: (model.relationName, followed by quote
  const match = /^\(\s*model\.(\w+)\s*,\s*['"]?$/.exec(textBetween);
  if (match) return match[1];

  // Also match inside array: (model.relationName, ['
  const arrayMatch = /^\(\s*model\.(\w+)\s*,\s*\[?\s*['"]?$/.exec(textBetween);
  return arrayMatch?.[1] ?? null;
}

/**
 * Detect if cursor is inside the conditions object of exists/all.
 * Returns conditionKey or conditionValue context.
 */
function detectConditionContext(
  textBeforeCursor: string,
): ExpressionCompletionContext | null {
  const conditionMatch = /(?:exists|all)\(\s*model\.(\w+)\s*,\s*\{[^}]*$/.exec(
    textBeforeCursor,
  );
  if (!conditionMatch) return null;

  const relationName = conditionMatch[1];

  // Check if we're typing a value (after ':') or a key
  const afterLastSeparator = textBeforeCursor.slice(
    Math.max(
      textBeforeCursor.lastIndexOf('{'),
      textBeforeCursor.lastIndexOf(','),
    ),
  );
  const isTypingValue = /:\s*\w*$/.test(afterLastSeparator);

  return isTypingValue
    ? { type: 'conditionValue', relationName }
    : { type: 'conditionKey', relationName };
}

/**
 * Detect if cursor is completing a model.* path using CodeMirror's completionPath.
 * Distinguishes between model field access and model relation access (inside function calls).
 */
function detectModelPathContext(
  state: CompletionContext['state'],
  pos: number,
): ExpressionCompletionContext | null {
  // completionPath requires a CompletionContext-like call, but we can construct
  // a minimal one. However, completionPath needs the actual CompletionContext.
  // Instead, use text-based detection for model.* paths.
  const lineFrom = state.doc.lineAt(pos).from;
  const lineText = state.doc.sliceString(lineFrom, pos);

  // Check if we're typing model.something
  const modelMatch = /model\.(\w*)$/.exec(lineText);
  if (!modelMatch) return null;

  // Check if model. is inside a function call expecting a relation arg
  const textBefore = state.doc.sliceString(0, pos - modelMatch[0].length);
  const isInsideFnArg = /(?:hasRole|hasSomeRole|exists|all)\(\s*$/.test(
    textBefore,
  );

  return isInsideFnArg ? { type: 'modelRelation' } : { type: 'modelField' };
}

// ---------------------------------------------------------------------------
// Completion adapter — maps context types to CodeMirror completions
// ---------------------------------------------------------------------------

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
  /** Scalar fields on the foreign model for exists/all condition completions */
  foreignScalarFields?: { name: string; type: string }[];
}

/**
 * Creates autocomplete for model and auth context.
 *
 * Uses `resolveExpressionCompletionContext` to determine what the user is typing,
 * then maps the context type to appropriate completions:
 * - Top level: model, userId, isAuthenticated, hasRole, hasSomeRole, exists, all
 * - model.: scalar fields or relation names (depending on context)
 * - Inside hasRole('...'): project roles or foreign model's authorizer roles
 * - Inside exists/all conditions: foreign model field names or value suggestions
 */
export function createAuthorizerCompletions(
  modelConfig: ModelConfig,
  projectRoles: string[],
  relationInfoList: RelationAutocompleteInfo[] = [],
): (context: CompletionContext) => CompletionResult | null {
  // Build scalar field completions
  const scalarFieldCompletions: Completion[] = modelConfig.model.fields.map(
    (field) => ({
      label: field.name,
      type: 'property',
      detail: field.type,
    }),
  );

  // Build relation completions
  const relationCompletions: Completion[] = relationInfoList.map((rel) => ({
    label: rel.relationName,
    type: 'property',
    detail: `→ ${rel.foreignModelName}`,
    info: 'Relation (use with hasRole/hasSomeRole/exists/all)',
  }));

  // Build role lookup maps
  const foreignRolesByRelation = new Map<string, string[]>();
  for (const rel of relationInfoList) {
    if (rel.foreignAuthorizerRoleNames.length > 0) {
      foreignRolesByRelation.set(
        rel.relationName,
        rel.foreignAuthorizerRoleNames,
      );
    }
  }

  // Build foreign field completions for exists/all conditions
  const foreignFieldsByRelation = new Map<string, Completion[]>();
  for (const rel of relationInfoList) {
    if (rel.foreignScalarFields && rel.foreignScalarFields.length > 0) {
      foreignFieldsByRelation.set(
        rel.relationName,
        rel.foreignScalarFields.map((f) => ({
          label: f.name,
          type: 'property',
          detail: f.type,
          info: `Field on ${rel.foreignModelName}`,
        })),
      );
    }
  }

  // Value completions for condition values
  const conditionValueCompletions: Completion[] = [
    {
      label: 'userId',
      type: 'property',
      detail: 'string | undefined',
      info: 'Current user ID',
    },
    { label: 'true', type: 'keyword' },
    { label: 'false', type: 'keyword' },
  ];

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
    snippetCompletion('exists(model.${relation}, { ${field}: ${value} })', {
      label: 'exists',
      type: 'method',
      detail: '(model.relation, conditions) => boolean',
      info: 'Check if any related record matches conditions',
    }),
    snippetCompletion('all(model.${relation}, { ${field}: ${value} })', {
      label: 'all',
      type: 'method',
      detail: '(model.relation, conditions) => boolean',
      info: 'Check if all related records match conditions',
    }),
    { label: 'true', type: 'keyword' },
    { label: 'false', type: 'keyword' },
  ];

  // Add per-relation snippets
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
    topLevelCompletions.push(
      snippetCompletion(
        `exists(model.${rel.relationName}, { \${field}: \${value} })`,
        {
          label: `exists(model.${rel.relationName})`,
          type: 'method',
          detail: `→ ${rel.foreignModelName}`,
          info: `Check if any related ${rel.foreignModelName} matches conditions`,
          boost: -3,
        },
      ),
      snippetCompletion(
        `all(model.${rel.relationName}, { \${field}: \${value} })`,
        {
          label: `all(model.${rel.relationName})`,
          type: 'method',
          detail: `→ ${rel.foreignModelName}`,
          info: `Check if all related ${rel.foreignModelName} records match conditions`,
          boost: -4,
        },
      ),
    );
  }

  // Return the completion handler
  return (context: CompletionContext): CompletionResult | null => {
    const ctxType = resolveExpressionCompletionContext(
      context.state,
      context.pos,
    );

    switch (ctxType.type) {
      case 'roleString': {
        const tree = syntaxTree(context.state);
        const stringNode = tree.resolveInner(context.pos, -1);
        if (stringNode.name !== 'String') return null;

        const stringStart = stringNode.from + 1;

        // Nested call — show foreign model's authorizer roles
        if (ctxType.nestedRelationName) {
          const foreignRoles = foreignRolesByRelation.get(
            ctxType.nestedRelationName,
          );
          if (foreignRoles && foreignRoles.length > 0) {
            return {
              from: stringStart,
              options: foreignRoles.map((role) => ({
                label: role,
                type: 'constant',
                info: `Role on ${relationInfoList.find((r) => r.relationName === ctxType.nestedRelationName)?.foreignModelName ?? 'related model'} authorizer`,
              })),
            };
          }
        }

        // Project-level roles
        return {
          from: stringStart,
          options: projectRoles.map((role) => ({
            label: role,
            type: 'constant',
            info: 'Role defined in project auth config',
          })),
        };
      }

      case 'conditionKey': {
        const word = context.matchBefore(/\w*/);
        const fields = foreignFieldsByRelation.get(ctxType.relationName);
        return word && fields ? { from: word.from, options: fields } : null;
      }

      case 'conditionValue': {
        const word = context.matchBefore(/\w*/);
        return word
          ? { from: word.from, options: conditionValueCompletions }
          : null;
      }

      case 'modelRelation': {
        const word = context.matchBefore(/model\.\w*/);
        return word
          ? { from: word.from + 6, options: relationCompletions }
          : null;
      }

      case 'modelField': {
        const word = context.matchBefore(/model\.\w*/);
        return word
          ? { from: word.from + 6, options: scalarFieldCompletions }
          : null;
      }

      case 'topLevel': {
        const word = context.matchBefore(/\w+/);
        return word ? { from: word.from, options: topLevelCompletions } : null;
      }

      case 'none': {
        return null;
      }
    }
  };
}
