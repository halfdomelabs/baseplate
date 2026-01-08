import React from 'react';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { SchemaParserContext } from '#src/parser/types.js';
import type { PluginSpecStore } from '#src/plugins/index.js';
import type { DefinitionSchemaParserContext } from '#src/schema/index.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

/**
 * A function that sets the project definition.
 *
 * This can be a function that returns a new project definition, or a function that
 * mutates the existing project definition (using Immer).
 */
export type ProjectDefinitionSetter = (draftConfig: ProjectDefinition) => void;

export interface SaveDefinitionWithFeedbackOptions {
  disableDeleteRefDialog?: boolean;
  successMessage?: string;
  onSuccess?: () => void;
}

/**
 * The result of the `useProjectDefinition` hook.
 */
export interface UseProjectDefinitionResult {
  /**
   * The current project definition.
   */
  definition: ProjectDefinition;
  /**
   * The project definition container.
   */
  definitionContainer: ProjectDefinitionContainer;
  /**
   * Whether the project definition has been updated externally.
   */
  updatedExternally: boolean;
  /**
   * Save the project definition.
   */
  saveDefinition: (definition: ProjectDefinitionSetter) => Promise<void>;
  /**
   * Save the project definition with feedback showing a toast
   * when there are errors or a success message when the definition is saved.
   */
  saveDefinitionWithFeedback: (
    definition: ProjectDefinitionSetter,
    options?: SaveDefinitionWithFeedbackOptions,
  ) => Promise<{ success: boolean }>;
  /**
   * Save the project definition with feedback showing a toast
   * when there are errors or a success message when the definition is saved.
   */
  saveDefinitionWithFeedbackSync: (
    definition: ProjectDefinitionSetter,
    options?: SaveDefinitionWithFeedbackOptions,
  ) => void;
  /**
   * Whether the project definition is being saved.
   */
  isSavingDefinition: boolean;
  /**
   * The plugin container.
   */
  pluginContainer: PluginSpecStore;
  /**
   * The schema parser context.
   */
  schemaParserContext: SchemaParserContext;
  /**
   * The definition schema parser context.
   */
  definitionSchemaParserContext: DefinitionSchemaParserContext;
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
