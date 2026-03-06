import type { DefinitionIssueCheckerContext } from '#src/schema/creator/definition-issue-checker-spec.js';
import type { DefinitionIssue } from '#src/schema/creator/definition-issue-types.js';
import type { ProjectDefinition } from '#src/schema/project-definition.js';

type ModelDefinition = ProjectDefinition['models'][number];

/**
 * Checks that relation reference pairs have matching scalar field types.
 *
 * For each relation, compares the type of the local scalar field with the
 * type of the foreign scalar field. Emits a warning when types differ.
 */
export function checkRelationTypeMismatch(
  definition: ProjectDefinition,
  _context: DefinitionIssueCheckerContext,
): DefinitionIssue[] {
  const { models } = definition;
  const issues: DefinitionIssue[] = [];

  // After deserialization, refs (modelRef, localRef, foreignRef) are entity IDs
  const modelById = new Map<string, ModelDefinition>();
  for (const model of models) {
    modelById.set(model.id, model);
  }

  for (const [modelIndex, model] of models.entries()) {
    const relations = model.model.relations ?? [];

    for (const [relationIndex, relation] of relations.entries()) {
      const foreignModel = modelById.get(relation.modelRef);
      if (!foreignModel) {
        continue;
      }

      for (const [refIndex, ref] of relation.references.entries()) {
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
          issues.push({
            message: `Relation '${relation.name}' type mismatch: '${localField.name}' is '${localField.type}' but '${foreignField.name}' on '${foreignModel.name}' is '${foreignField.type}'`,
            path: [
              'models',
              modelIndex,
              'model',
              'relations',
              relationIndex,
              'references',
              refIndex,
            ],
            severity: 'warning',
          });
        }
      }
    }
  }

  return issues;
}
