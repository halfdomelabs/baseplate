import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

import { PluginUtils } from '@baseplate-dev/project-builder-lib';

import type { EmailPluginDefinition } from '../core/schema/plugin-definition.js';

/**
 * Get the email plugin definition from the project definition.
 * @param definition - The project definition.
 * @returns The email plugin definition.
 */
export function getEmailPluginDefinition(
  definition: ProjectDefinition,
): EmailPluginDefinition {
  return PluginUtils.configByKeyOrThrow(
    definition,
    'baseplate-dev_plugin-email_email',
  ) as EmailPluginDefinition;
}
