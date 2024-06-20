import {
  ProjectDefinition,
  ProjectDefinitionInput,
  ParsedProjectDefinition,
  ProjectDefinitionContainer,
  ZodPluginImplementationStore,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import React from 'react';

export type SetOrTransformConfig =
  | ProjectDefinitionInput
  | ((draftConfig: ProjectDefinition) => void);

export interface SetProjectDefinitionOptions {
  fixReferences?: boolean;
}

export interface UseProjectDefinitionResult {
  config: ProjectDefinition;
  parsedProject: ParsedProjectDefinition;
  definitionContainer: ProjectDefinitionContainer;
  setConfigAndFixReferences: (configOrTransform: SetOrTransformConfig) => void;
  setConfig: (
    configOrTransform: SetOrTransformConfig,
    options?: SetProjectDefinitionOptions,
  ) => void;
  externalChangeCounter: number;
  pluginContainer: ZodPluginImplementationStore;
  schemaParserContext: SchemaParserContext;
}

export const ProjectDefinitionContext =
  React.createContext<UseProjectDefinitionResult | null>(null);

export function useProjectDefinition(): UseProjectDefinitionResult {
  const result = React.useContext(ProjectDefinitionContext);
  if (!result) {
    throw new Error(
      `useProjectDefinition must be used within a <ProjectDefinitionProvider>`,
    );
  }
  return result;
}
