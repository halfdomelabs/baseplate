import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type {
  DefinitionIssue,
  DefinitionIssueFix,
} from '#src/schema/creator/definition-issue-types.js';
import type { ModelScalarFieldConfig } from '#src/schema/models/models.js';

import { ModelUtils } from '#src/definition/index.js';
import { createEntityIssue } from '#src/parser/definition-issue-utils.js';

/**
 * Creates a fix that changes the local field's type to match the foreign field's type.
 */
function createTypeMismatchFix(
  modelId: string,
  localField: ModelScalarFieldConfig,
  foreignField: ModelScalarFieldConfig,
): DefinitionIssueFix {
  return {
    label: `Change '${localField.name}' type to '${foreignField.type}'`,
    applySetter: (draft) => {
      const draftModel = ModelUtils.byIdOrThrow(draft, modelId);
      const draftField = ModelUtils.getScalarFieldById(
        draftModel,
        localField.id,
      );

      // Update the field type and reset options for the new type.
      // For enum fields, copy the enumRef from the foreign field.
      if (foreignField.type === 'enum') {
        draftField.type = 'enum';
        draftField.options = { ...foreignField.options };
        Object.assign(draftField, {
          type: 'enum',
          options: { ...foreignField.options },
        });
      } else {
        Object.assign(draftField, {
          type: foreignField.type,
          options: {},
        });
      }
    },
  };
}

/**
 * Checks that relation reference pairs have matching scalar field types.
 *
 * For each relation, compares the type of the local scalar field with the
 * type of the foreign scalar field. Emits a warning when types differ.
 */
export function checkRelationTypeMismatch(
  container: ProjectDefinitionContainer,
): DefinitionIssue[] {
  const { models } = container.definition;
  const issues: DefinitionIssue[] = [];

  for (const model of models) {
    const { relations } = model.model;

    for (const [relationIndex, relation] of relations.entries()) {
      const foreignModel = ModelUtils.byId(
        container.definition,
        relation.modelRef,
      );
      if (!foreignModel) {
        continue;
      }

      for (const ref of relation.references) {
        const localField = model.model.fields.find(
          (f) => f.id === ref.localRef,
        );
        const foreignField = foreignModel.model.fields.find(
          (f) => f.id === ref.foreignRef,
        );

        if (!localField || !foreignField) {
          continue;
        }

        if (localField.type !== foreignField.type) {
          const fix = createTypeMismatchFix(model.id, localField, foreignField);

          issues.push(
            createEntityIssue(
              container,
              model.id,
              ['model', 'relations', relationIndex],
              {
                message: `Relation '${relation.name}' type mismatch: '${localField.name}' is '${localField.type}' but '${foreignField.name}' on '${foreignModel.name}' is '${foreignField.type}'`,
                severity: 'warning',
                fix,
              },
            ),
          );
        }
      }
    }
  }

  return issues;
}
