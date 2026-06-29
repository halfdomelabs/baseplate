import type { DefinitionIssue } from '@baseplate-dev/project-builder-lib';

import {
  deleteEntity,
  modelEntityType,
  modelLocalRelationEntityType,
  ModelUtils,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getOrCreateDraftSession } from './draft-session.js';
import { assertEntityTypeNotBlacklisted } from './entity-type-blacklist.js';
import {
  definitionIssueSchema,
  mapIssueToOutput,
  validateAndSaveDraft,
  writeIssuesCliOutput,
} from './validate-draft.js';

const stageDeleteEntityInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  entityTypeName: z
    .string()
    .describe('The entity type being deleted (e.g., "feature", "model").'),
  entityId: z
    .string()
    .describe('The ID of the entity to delete (e.g., "model:abc123").'),
});

const stageDeleteEntityOutputSchema = z.object({
  message: z.string().describe('A summary of the staged change.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Definition issues found after staging.'),
});

export const stageDeleteEntityAction = createServiceAction({
  name: 'stage-delete-entity',
  title: 'Stage Delete Entity',
  description:
    'Stage an entity deletion in the draft session. Changes are not persisted until commit-draft is called.',
  inputSchema: stageDeleteEntityInputSchema,
  outputSchema: stageDeleteEntityOutputSchema,
  handler: async (input, context) => {
    assertEntityTypeNotBlacklisted(input.entityTypeName);

    const {
      session,
      entityContext,
      container,
      parserContext,
      projectDirectory,
    } = await getOrCreateDraftSession(input.project, context);

    // When deleting a model, other models' relations hold an `onDelete: RESTRICT`
    // reference to it (modelRef), which would block the delete during validation.
    // Cascade-delete those incoming relations first so the draft stays valid, then
    // delete the model itself. Each cascaded relation is reported as a warning.
    const cascadeWarnings: DefinitionIssue[] = [];
    if (input.entityTypeName === modelEntityType.name) {
      const incomingRelations = ModelUtils.getRelationsToModel(
        container.definition,
        input.entityId,
      ).filter(({ model }) => model.id !== input.entityId); // self-relations vanish with the model

      for (const { model, relation } of incomingRelations) {
        cascadeWarnings.push({
          message: `Auto-deleted relation '${relation.name}' on model '${model.name}' that referenced the deleted model.`,
          severity: 'warning',
          entityId: model.id,
          path: ['model', 'relations'],
        });
      }

      // Delete the incoming relation entities sequentially, rebuilding the entity
      // context after each splice so paths/ids stay accurate (deleteEntity is
      // immutable and bound to a single container snapshot).
      let workingDefinition = entityContext.serializedDefinition;
      let workingContext = entityContext;
      for (const { relation } of incomingRelations) {
        workingDefinition = deleteEntity(
          {
            entityTypeName: modelLocalRelationEntityType.name,
            entityId: relation.id,
          },
          workingContext,
        );
        workingContext = ProjectDefinitionContainer.fromSerializedConfig(
          workingDefinition,
          parserContext,
        ).toEntityServiceContext();
      }

      const newDefinition = deleteEntity(
        {
          entityTypeName: input.entityTypeName,
          entityId: input.entityId,
        },
        workingContext,
      );

      const { warnings } = await validateAndSaveDraft(
        newDefinition,
        parserContext,
        session,
        projectDirectory,
      );

      const allWarnings = [...cascadeWarnings, ...warnings];
      return {
        message: `Staged deletion of ${input.entityTypeName} entity "${input.entityId}". Use commit-draft to persist.`,
        issues:
          allWarnings.length > 0
            ? allWarnings.map(mapIssueToOutput)
            : undefined,
      };
    }

    const newDefinition = deleteEntity(
      {
        entityTypeName: input.entityTypeName,
        entityId: input.entityId,
      },
      entityContext,
    );

    const { warnings } = await validateAndSaveDraft(
      newDefinition,
      parserContext,
      session,
      projectDirectory,
    );

    return {
      message: `Staged deletion of ${input.entityTypeName} entity "${input.entityId}". Use commit-draft to persist.`,
      issues: warnings.length > 0 ? warnings.map(mapIssueToOutput) : undefined,
    };
  },
  writeCliOutput: writeIssuesCliOutput,
});
