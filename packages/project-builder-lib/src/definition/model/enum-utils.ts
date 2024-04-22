import { EnumConfig, ProjectDefinition } from '@src/schema/index.js';

function byId(projectDefinition: ProjectDefinition, id: string): EnumConfig {
  const enumConfig = projectDefinition.enums?.find((e) => e.id === id);
  if (!enumConfig) {
    throw new Error(`Could not find enum with ID ${id}`);
  }
  return enumConfig;
}

export const EnumUtils = {
  byId,
};
