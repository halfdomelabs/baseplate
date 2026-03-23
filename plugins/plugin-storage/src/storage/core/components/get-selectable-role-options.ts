import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';
import type { UseProjectDefinitionResult } from '@baseplate-dev/project-builder-lib/web';

import { authConfigSpec } from '@baseplate-dev/project-builder-lib';

/**
 * Returns role options suitable for selection in storage forms.
 * Excludes auto-assigned roles (e.g. system, public) but keeps 'user'
 * since it's commonly needed for upload authorization.
 */
export function getSelectableRoleOptions(
  pluginContainer: UseProjectDefinitionResult['pluginContainer'],
  definition: ProjectDefinition,
): { label: string; value: string }[] {
  return pluginContainer
    .use(authConfigSpec)
    .getAuthConfigOrThrow(definition)
    .roles.filter((role) => !role.autoAssigned || role.name === 'user')
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));
}
