import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { DefinitionIssue } from './definition-issue-types.js';

/**
 * A definition-level issue checker that operates on the full project definition.
 * Can propose definition-wide auto-fixes.
 *
 * Unlike field-level checkers (registered via `withIssueChecker` on schema nodes),
 * definition-level checkers receive the entire project definition and can perform
 * cross-cutting validations like port conflicts, FK type mismatches, or missing
 * models required by plugins.
 */
export type DefinitionIssueChecker = (definition: unknown) => DefinitionIssue[];

/**
 * Plugin spec for registering definition-level issue checkers.
 *
 * Plugins register checkers during initialization:
 * ```typescript
 * createPluginModule({
 *   dependencies: { issueCheckers: definitionIssueCheckerSpec },
 *   initialize: ({ issueCheckers }, { pluginKey }) => {
 *     issueCheckers.checkers.set(pluginKey, (definition) => {
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
    checkers: t.map<string, DefinitionIssueChecker>(),
  }),
  {
    use: (values) => ({
      getAllCheckers: (): Map<string, DefinitionIssueChecker> =>
        values.checkers,
    }),
  },
);
