import type { EnumConfig, ProjectDefinition } from '#src/schema/index.js';

function byId(
  projectDefinition: ProjectDefinition,
  id: string,
): EnumConfig | undefined {
  return projectDefinition.enums?.find((e) => e.id === id);
}

function byIdOrThrow(
  projectDefinition: ProjectDefinition,
  id: string,
): EnumConfig {
  const enumConfig = byId(projectDefinition, id);
  if (!enumConfig) {
    throw new Error(`Could not find enum with ID ${id}`);
  }
  return enumConfig;
}

export const EnumUtils = {
  byId,
  byIdOrThrow,
};
