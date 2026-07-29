import { PASCAL_CASE_REGEX } from '@baseplate-dev/utils';

import type {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
  ProjectDefinition,
} from '#src/schema/index.js';

function byId(
  projectDefinition: ProjectDefinition,
  id: string,
): ModelConfig | undefined {
  return projectDefinition.models.find((m) => m.id === id);
}

function byIdOrThrow(
  projectDefinition: ProjectDefinition,
  id: string,
): ModelConfig {
  const model = byId(projectDefinition, id);
  if (!model) {
    throw new Error(`Could not find model with ID ${id}`);
  }
  return model;
}

function byName(
  projectDefinition: ProjectDefinition,
  name: string,
): ModelConfig | undefined {
  return projectDefinition.models.find((m) => m.name === name);
}

function byNameOrThrow(
  projectDefinition: ProjectDefinition,
  name: string,
): ModelConfig {
  const model = byName(projectDefinition, name);
  if (!model) {
    throw new Error(`Could not find model with name ${name}`);
  }
  return model;
}

function getScalarFieldById(
  model: ModelConfig,
  id: string,
): ModelScalarFieldConfig {
  const field = model.model.fields.find((f) => f.id === id);

  if (!field) {
    throw new Error(`Could not find field with ID ${id}`);
  }
  return field;
}

function getRelationsToModel(
  projectDefinition: ProjectDefinition,
  modelId: string,
): { model: ModelConfig; relation: ModelRelationFieldConfig }[] {
  return projectDefinition.models.flatMap((m) =>
    m.model.relations
      .filter((r) => r.modelRef === modelId)
      .map((r) => ({ model: m, relation: r })),
  );
}

function getModelsForFeature(
  projectDefinition: ProjectDefinition,
  featureId: string,
): ModelConfig[] {
  return projectDefinition.models.filter((m) => m.featureRef === featureId);
}

function getModelIdFields(model: ModelConfig): string[] {
  return model.model.primaryKeyFieldRefs;
}

function hasService(model: ModelConfig): boolean {
  return (
    model.service.create.enabled ||
    model.service.update.enabled ||
    model.service.delete.enabled ||
    model.service.transformers.length > 0
  );
}

function validateModelName(name: string): boolean {
  return PASCAL_CASE_REGEX.test(name);
}

/**
 * Returns the ID of a model by name, or the name if no model is found.
 * @param projectDefinition - The project definition.
 * @param name - The name of the model.
 * @returns The ID of the model, or the name if no model is found.
 */
function getModelIdByNameOrDefault(
  projectDefinition: ProjectDefinition,
  name: string,
): string {
  return projectDefinition.models.find((m) => m.name === name)?.id ?? name;
}

function getPrimaryKeyFields(model: ModelConfig): ModelScalarFieldConfig[] {
  const primaryKeyFields = model.model.primaryKeyFieldRefs;
  return primaryKeyFields.map((id) => getScalarFieldById(model, id));
}

/**
 * Whether a field with the given read-role restriction is safe to expose as
 * a where-filter operand on a query with the given read-role restriction.
 *
 * A field is safe to filter on only if every principal who can call the
 * query can also read the field's value — i.e. the field's own restriction
 * (if any) is no narrower than the query's. Role lists are OR'd (holding
 * *any* listed role grants access), and an EMPTY role list means
 * "unrestricted" (everyone), not "no one" — the widest grant, not the
 * narrowest. So:
 *  - field unrestricted (empty) -> always safe, regardless of the query.
 *  - query unrestricted (empty) but field restricted -> never safe (the
 *    query admits everyone; the field doesn't).
 *  - both restricted -> safe only if every query role is also a field role
 *    (the query's role set is a SUBSET of the field's), so no principal can
 *    pass the query's gate without also passing the field's.
 *
 * @param field - The field's `globalRoles`/`instanceRoles` restriction.
 * @param query - The query's `globalRoles`/`instanceRoles` restriction.
 * @returns Whether the field is safe to filter on given the query's gate.
 */
function isFieldSafeToFilter(
  field: { globalRoles: string[]; instanceRoles: string[] },
  query: { globalRoles: string[]; instanceRoles: string[] },
): boolean {
  const isFieldRestricted =
    field.globalRoles.length > 0 || field.instanceRoles.length > 0;
  if (!isFieldRestricted) {
    return true;
  }
  const isQueryRestricted =
    query.globalRoles.length > 0 || query.instanceRoles.length > 0;
  if (!isQueryRestricted) {
    return false;
  }
  const isSubset = (subset: string[], superset: string[]): boolean =>
    subset.every((role) => superset.includes(role));
  return (
    isSubset(query.globalRoles, field.globalRoles) &&
    isSubset(query.instanceRoles, field.instanceRoles)
  );
}

/**
 * Returns the IDs of models that need an `OrderByInput` GraphQL type because
 * some *other* model exposes a list relation to them marked `orderable`.
 *
 * The `orderable` flag lives on the *referenced* model's foreign relation
 * entry (e.g. `User.todoLists`), but the input type belongs to the model the
 * relation is declared on (`TodoList`, whose `owner` relation carries the
 * matching globally-unique `foreignId`) — that is the model whose rows are
 * being sorted.
 *
 * @param projectDefinition - The project definition.
 * @returns The set of model IDs requiring an `OrderByInput` type.
 */
function getModelIdsRequiringOrderByInput(
  projectDefinition: ProjectDefinition,
): Set<string> {
  const orderableForeignIds = new Set(
    projectDefinition.models
      .filter((m) => m.graphql.objectType.enabled)
      .flatMap((m) =>
        m.graphql.objectType.foreignRelations
          .filter((entry) => entry.orderable)
          .map((entry) => entry.ref),
      ),
  );
  return new Set(
    projectDefinition.models
      .filter((m) =>
        m.model.relations.some((relation) =>
          orderableForeignIds.has(relation.foreignId),
        ),
      )
      .map((m) => m.id),
  );
}

export const ModelUtils = {
  byId,
  byIdOrThrow,
  byName,
  byNameOrThrow,
  getScalarFieldById,
  getRelationsToModel,
  getModelIdsRequiringOrderByInput,
  getModelsForFeature,
  getModelIdFields,
  hasService,
  validateModelName,
  getModelIdByNameOrDefault,
  getPrimaryKeyFields,
  isFieldSafeToFilter,
};
