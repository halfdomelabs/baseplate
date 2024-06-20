import { BasePlugin, ProjectDefinition } from '@src/schema/index.js';

function byId(
  projectDefinition: ProjectDefinition,
  id: string,
): BasePlugin | null {
  const plugin = projectDefinition.plugins?.find((m) => m.id === id);
  return plugin ?? null;
}

function byIdOrThrow(
  projectDefinition: ProjectDefinition,
  id: string,
): BasePlugin {
  const plugin = projectDefinition.plugins?.find((m) => m.id === id);
  if (!plugin) {
    throw new Error(`Could not find plugin with ID ${id}`);
  }
  return plugin;
}

export const PluginUtils = {
  byId,
  byIdOrThrow,
};
