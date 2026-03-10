import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { DefinitionIssue } from '#src/schema/creator/definition-issue-types.js';

import { createEntityIssue } from '#src/parser/definition-issue-utils.js';
import { authConfigSpec } from '#src/plugins/spec/auth-config-spec.js';

type MutationMethod = 'create' | 'delete' | 'update';

const MUTATION_METHODS: MutationMethod[] = ['create', 'update', 'delete'];

/**
 * Checks that service mutations exposed to GraphQL have roles assigned when auth is enabled.
 *
 * Skips validation when no auth plugin is configured. For each model with
 * enabled service methods that are also exposed via GraphQL mutations,
 * warns if no global roles (or instance roles for update/delete) are assigned.
 */
export function checkMutationRoles(
  container: ProjectDefinitionContainer,
): DefinitionIssue[] {
  const { definition, pluginStore } = container;
  const authConfig = pluginStore.use(authConfigSpec);

  // If auth is not configured, skip validation
  if (!authConfig.getAuthConfig(definition)) {
    return [];
  }

  const { models } = definition;
  const issues: DefinitionIssue[] = [];

  for (const model of models) {
    for (const method of MUTATION_METHODS) {
      const serviceMethod = model.service[method];
      const graphqlMutation = model.graphql.mutations[method];

      if (!serviceMethod.enabled || !graphqlMutation.enabled) {
        continue;
      }

      const hasGlobalRoles = serviceMethod.globalRoles.length > 0;
      const hasInstanceRoles =
        method !== 'create' &&
        'instanceRoles' in serviceMethod &&
        serviceMethod.instanceRoles.length > 0;

      if (!hasGlobalRoles && !hasInstanceRoles) {
        issues.push(
          createEntityIssue(
            container,
            model.id,
            ['service', method, 'globalRoles'],
            {
              message: `Model '${model.name}' ${method} mutation is exposed to GraphQL but has no roles assigned`,
              severity: 'warning',
            },
          ),
        );
      }
    }
  }

  return issues;
}
