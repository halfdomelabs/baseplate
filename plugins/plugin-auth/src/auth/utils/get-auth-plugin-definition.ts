import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

import { PluginUtils } from '@baseplate-dev/project-builder-lib';

import type { AuthPluginDefinition } from '../core/schema/plugin-definition.js';

/**
 * Get the auth plugin definition from the project definition.
 * @param definition - The project definition.
 * @returns The auth plugin definition.
 */
export function getAuthPluginDefinition(
  definition: ProjectDefinition,
): AuthPluginDefinition {
  return PluginUtils.configByKeyOrThrow(
    definition,
    'baseplate-dev_plugin-auth_auth',
  ) as AuthPluginDefinition;
}
