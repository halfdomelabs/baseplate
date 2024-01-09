import { EnumConfig, ProjectConfig } from '@src/schema/index.js';

function byId(projectConfig: ProjectConfig, id: string): EnumConfig {
  const enumConfig = projectConfig.enums?.find((e) => e.id === id);
  if (!enumConfig) {
    throw new Error(`Could not find enum with ID ${id}`);
  }
  return enumConfig;
}

export const EnumUtils = {
  byId,
};
