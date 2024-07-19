import React from 'react';

import { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import { ParsedProjectDefinition } from '@src/parser/index.js';
import { SchemaParserContext } from '@src/parser/types.js';
import { PluginImplementationStore } from '@src/plugins/index.js';
import {
  ProjectDefinition,
  ProjectDefinitionInput,
} from '@src/schema/projectDefinition.js';

export type SetOrTransformConfig =
  | ProjectDefinitionInput
  | ((draftConfig: ProjectDefinition) => void);

export interface SetProjectDefinitionOptions {
  fixReferences?: boolean;
}

export interface UseProjectDefinitionResult {
  definition: ProjectDefinition;
  parsedProject: ParsedProjectDefinition;
  definitionContainer: ProjectDefinitionContainer;
  setConfigAndFixReferences: (configOrTransform: SetOrTransformConfig) => void;
  setConfig: (
    configOrTransform: SetOrTransformConfig,
    options?: SetProjectDefinitionOptions,
  ) => void;
  externalChangeCounter: number;
  pluginContainer: PluginImplementationStore;
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
