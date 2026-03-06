import type { PluginSpecStore } from '#src/plugins/index.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { checkMutationRoles } from '#src/parser/definition-issue-checkers/mutation-roles-checker.js';
import { checkRelationTypeMismatch } from '#src/parser/definition-issue-checkers/relation-type-mismatch-checker.js';
import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { DefinitionIssue } from './definition-issue-types.js';

/**
 * Context provided to definition-level issue checkers.
 */
export interface DefinitionIssueCheckerContext {
  /** The plugin spec store for accessing plugin configurations */
  readonly pluginStore: PluginSpecStore;
}

/**
 * A definition-level issue checker that operates on the full project definition.
 * Can propose definition-wide auto-fixes.
 *
 * Unlike field-level checkers (registered via `withIssueChecker` on schema nodes),
 * definition-level checkers receive the entire project definition and can perform
 * cross-cutting validations like port conflicts, FK type mismatches, or missing
 * models required by plugins.
 */
export type DefinitionIssueChecker = (
  definition: ProjectDefinition,
  context: DefinitionIssueCheckerContext,
) => DefinitionIssue[];

const BUILT_IN_CHECKERS = new Map<string, DefinitionIssueChecker>([
  ['core/relation-type-mismatch', checkRelationTypeMismatch],
  ['core/mutation-roles', checkMutationRoles],
]);

/**
 * Plugin spec for registering definition-level issue checkers.
 *
 * Built-in checkers (relation type mismatch, mutation roles) are included
 * by default. Plugins can register additional checkers during initialization:
 * ```typescript
 * createPluginModule({
 *   dependencies: { issueCheckers: definitionIssueCheckerSpec },
 *   initialize: ({ issueCheckers }, { pluginKey }) => {
 *     issueCheckers.checkers.set(pluginKey, (definition, context) => {
 *       // validate definition and return issues
 *       return [];
 *     });
 *   },
 * });
 * ```
 */
export const definitionIssueCheckerSpec = createFieldMapSpec(
  'core/definition-issue-checkers',
  (t) => ({
    checkers: t.map<string, DefinitionIssueChecker>(BUILT_IN_CHECKERS),
  }),
  {
    use: (values) => ({
      getAllCheckers: (): Map<string, DefinitionIssueChecker> =>
        values.checkers,
    }),
  },
);
