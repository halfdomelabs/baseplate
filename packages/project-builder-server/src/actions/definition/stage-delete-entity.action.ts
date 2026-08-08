import type { DefinitionIssue } from '@baseplate-dev/project-builder-lib';

import {
  deleteEntity,
  modelEntityType,
  ModelUtils,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import { createServiceAction } from '#src/actions/types.js';

import { getOrCreateDraftSession } from './draft-session.js';
import { assertEntityTypeNotBlacklisted } from './entity-type-blacklist.js';
import { stageDeleteEntityMetadata } from './stage-delete-entity.action-metadata.js';
import {
  mapIssueToOutput,
  validateAndSaveDraft,
  writeIssuesCliOutput,
} from './validate-draft.js';

export const stageDeleteEntityAction = createServiceAction({
  ...stageDeleteEntityMetadata,
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
    // Cascade-delete those incoming relations together with the model in a single
    // `fixRefDeletions` pass: removing the relation objects clears the RESTRICTs,
    // and the GraphQL `localRelations`/`foreignRelations` refs to those relations
    // (onDelete: DELETE_PARENT) cascade away inside the tolerant fixer. Each
    // cascaded relation is reported as a warning.
    if (input.entityTypeName === modelEntityType.name) {
      // Fail fast for a missing model: this branch bypasses `deleteEntity` (which
      // would throw on an unknown id), so without this guard an unknown entityId
      // would be a silent no-op that still reports a successful delete.
      if (!ModelUtils.byId(container.definition, input.entityId)) {
        throw new Error(
          `Entity "${input.entityId}" of type "${input.entityTypeName}" not found`,
        );
      }

      const incomingRelations = ModelUtils.getRelationsToModel(
        container.definition,
        input.entityId,
      ).filter(({ model }) => model.id !== input.entityId); // self-relations vanish with the model

      const cascadeWarnings: DefinitionIssue[] = incomingRelations.map(
        ({ model, relation }) => ({
          message: `Auto-deleted relation '${relation.name}' on model '${model.name}' that referenced the deleted model.`,
          severity: 'warning',
          entityId: model.id,
          path: ['model', 'relations'],
        }),
      );

      const result = container.fixRefDeletions((draftConfig) => {
        // Remove relations pointing at the deleted model first, then the model.
        for (const m of draftConfig.models) {
          m.model.relations = m.model.relations.filter(
            (r) => r.modelRef !== input.entityId,
          );
        }
        draftConfig.models = draftConfig.models.filter(
          (m) => m.id !== input.entityId,
        );
      });

      if (result.type === 'failure') {
        // Any remaining RESTRICT references (e.g. from plugins/services) still block.
        const messages = result.issues
          .map(
            (issue) =>
              `Cannot delete: referenced by ${issue.ref.path.join('.')} (onDelete: RESTRICT)`,
          )
          .join('; ');
        throw new Error(`Staging blocked by definition errors: ${messages}`);
      }

      // Rebuild a clean (dangle-free) container from the cascaded result and
      // serialize it back to a name-based definition for validation + save.
      const cleanedDefinition = new ProjectDefinitionContainer(
        result.refPayload,
        container.parserContext,
        container.pluginStore,
        container.schema,
      ).toEntityServiceContext().serializedDefinition;

      const { warnings } = await validateAndSaveDraft(
        cleanedDefinition,
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
