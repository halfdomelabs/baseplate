import React from 'react';

import type { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import type { ParsedProjectDefinition } from '@src/parser/index.js';
import type { SchemaParserContext } from '@src/parser/types.js';
import type { PluginImplementationStore } from '@src/plugins/index.js';
import type {
  ProjectDefinition,
  ProjectDefinitionInput,
} from '@src/schema/project-definition.js';

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
  lastModifiedAt?: string;
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
