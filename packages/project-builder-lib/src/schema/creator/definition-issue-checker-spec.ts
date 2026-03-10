import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { DefinitionIssue } from './definition-issue-types.js';

/**
 * A definition-level issue checker that operates on the full project definition.
 * Can propose definition-wide auto-fixes.
 *
 * Unlike field-level checkers (registered via `withIssueChecker` on schema nodes),
 * definition-level checkers receive the definition container and can perform
 * cross-cutting validations like port conflicts, FK type mismatches, or missing
 * models required by plugins.
 */
export type DefinitionIssueChecker = (
  container: ProjectDefinitionContainer,
) => DefinitionIssue[];

/**
 * Plugin spec for registering definition-level issue checkers.
 *
 * Built-in checkers (relation type mismatch, mutation roles) are registered
 * by `collectDefinitionIssues` at runtime to avoid circular imports between
 * schema/creator/ and parser/. Plugins can register additional checkers during
 * initialization:
 * ```typescript
 * createPluginModule({
 *   dependencies: { issueCheckers: definitionIssueCheckerSpec },
 *   initialize: ({ issueCheckers }, { pluginKey }) => {
 *     issueCheckers.checkers.set(pluginKey, (container) => {
 *       // validate container.definition and return issues
 *       return [];
 *     });
 *   },
 * });
 * ```
 */
export const definitionIssueCheckerSpec = createFieldMapSpec(
  'core/definition-issue-checkers',
  (t) => ({
    checkers: t.map<string, DefinitionIssueChecker>(),
  }),
  {
    use: (values) => ({
      getAllCheckers: (): Map<string, DefinitionIssueChecker> =>
        values.checkers,
    }),
  },
);
