import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { DefinitionIssue } from '#src/schema/creator/definition-issue-types.js';

import { ModelUtils } from '#src/definition/index.js';
import { createEntityIssue } from '#src/parser/definition-issue-utils.js';

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
          issues.push(
            createEntityIssue(
              container,
              model.id,
              ['model', 'relations', relationIndex],
              {
                message: `Relation '${relation.name}' type mismatch: '${localField.name}' is '${localField.type}' but '${foreignField.name}' on '${foreignModel.name}' is '${foreignField.type}'`,
                severity: 'warning',
              },
            ),
          );
        }
      }
    }
  }

  return issues;
}
