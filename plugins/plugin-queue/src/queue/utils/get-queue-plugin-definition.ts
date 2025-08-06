import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

import { PluginUtils } from '@baseplate-dev/project-builder-lib';

import type { QueuePluginDefinition } from '../core/schema/plugin-definition.js';

/**
 * Get the queue plugin definition from the project definition.
 * @param definition - The project definition.
 * @returns The queue plugin definition.
 */
export function getQueuePluginDefinition(
  definition: ProjectDefinition,
): QueuePluginDefinition {
  return PluginUtils.configByKeyOrThrow(
    definition,
    'baseplate-dev_plugin-queue_queue',
  ) as QueuePluginDefinition;
}
