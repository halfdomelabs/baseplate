import {
  ProjectConfig,
  FixReferenceRenamesOptions,
  ParsedProjectConfig,
} from '@baseplate/project-builder-lib';
import React from 'react';

export interface UseProjectConfigResult {
  config: ProjectConfig;
  parsedProject: ParsedProjectConfig;
  setConfigAndFixReferences: (
    transformer: (originalConfig: ProjectConfig) => void,
    options?: FixReferenceRenamesOptions
  ) => void;
  setConfig: (
    config: ProjectConfig | ((originalConfig: ProjectConfig) => void)
  ) => void;
}

export const ProjectConfigContext =
  React.createContext<UseProjectConfigResult | null>(null);

export function useProjectConfig(): UseProjectConfigResult {
  const result = React.useContext(ProjectConfigContext);
  if (!result) {
    throw new Error(
      `useProjectConfig must be used within a <ProjectConfigProvider>`
    );
  }
  return result;
}
