import {
  ProjectConfig,
  ProjectConfigInput,
  FixReferenceRenamesOptions,
  ParsedProjectConfig,
} from '@halfdomelabs/project-builder-lib';
import React from 'react';

export type SetOrTransformConfig =
  | ProjectConfigInput
  | ((draftConfig: ProjectConfig) => void);

export interface SetProjectConfigOptions {
  fixReferences?: boolean | FixReferenceRenamesOptions;
}

export interface UseProjectConfigResult {
  config: ProjectConfig;
  parsedProject: ParsedProjectConfig;
  setConfigAndFixReferences: (
    configOrTransform: SetOrTransformConfig,
    options?: FixReferenceRenamesOptions
  ) => void;
  setConfig: (
    configOrTransform: SetOrTransformConfig,
    options?: SetProjectConfigOptions
  ) => void;
  externalChangeCounter: number;
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
