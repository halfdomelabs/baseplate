import type {
  EnumConfig,
  ModelConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  getPothosPrismaOrderByInputTypeOutputName,
  getPothosPrismaWhereInputTypeOutputName,
  pothosEnumsFileGenerator,
  pothosPrismaConnectionQueryGenerator,
  pothosPrismaCountQueryGenerator,
  pothosPrismaCrudMutationGenerator,
  pothosPrismaEnumGenerator,
  pothosPrismaFindQueryGenerator,
  pothosPrismaListQueryGenerator,
  pothosPrismaObjectGenerator,
  pothosPrismaOrderByInputGenerator,
  pothosPrismaPrimaryKeyGenerator,
  pothosPrismaWhereInputGenerator,
  pothosTypesFileGenerator,
} from '@baseplate-dev/fastify-generators';
import { authConfigSpec, ModelUtils } from '@baseplate-dev/project-builder-lib';
import { notEmpty, uppercaseFirstChar } from '@baseplate-dev/utils';
import { kebabCase } from 'change-case';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

import {
  deriveMutationAuthorize,
  deriveQueryAuthorize,
} from './authorize-gate.js';

function buildObjectTypeFile(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { graphql } = model;
  const { objectType, mutations, queries } = graphql;

  const hasListSurface = ModelUtils.hasListSurface(queries);
  const buildQuery = queries.get.enabled || hasListSurface;
  const buildMutations =
    mutations.create.enabled ||
    mutations.update.enabled ||
    mutations.delete.enabled;

  if (!objectType.enabled) {
    return undefined;
  }

  const { fields, localRelations, foreignRelations } = objectType;

  const authConfig =
    appBuilder.definitionContainer.pluginStore.use(authConfigSpec);
  const isAuthEnabled = !!authConfig.getAuthConfig(
    appBuilder.projectDefinition,
  );

  // The shared `orderBy`/`where` config stores bare field refs, but the
  // filterable safety check below needs each field's read roles, which live on
  // the object type's own entry.
  const exposedFieldsByRef = new Map(fields.map((entry) => [entry.ref, entry]));
  const resolveExposedFields = (
    refs: string[],
    capability: string,
  ): typeof fields =>
    refs.map((ref) => {
      const entry = exposedFieldsByRef.get(ref);
      if (!entry) {
        throw new Error(
          `Model '${model.name}' lists field '${appBuilder.nameFromId(ref)}' as ${capability} ` +
            `but does not expose it on its GraphQL object type. Expose the field or remove ` +
            `it from the ${capability} list.`,
        );
      }
      return entry;
    });

  const filterableFieldEntries = resolveExposedFields(
    graphql.where.fields,
    'filterable',
  );
  const sortableFieldEntries = resolveExposedFields(
    graphql.orderBy.fields,
    'sortable',
  );
  const relationModels = ModelUtils.getRelationsToModel(
    appBuilder.projectDefinition,
    model.id,
  );
  const requiresOrderByInputForRelation =
    ModelUtils.getModelIdsRequiringOrderByInput(
      appBuilder.projectDefinition,
    ).has(model.id);

  if (
    hasListSurface &&
    queries.where.enabled &&
    isAuthEnabled &&
    filterableFieldEntries.length > 0
  ) {
    const unsafeFields = filterableFieldEntries.filter(
      (entry) =>
        !ModelUtils.isFieldSafeToFilter(
          {
            globalRoles: entry.globalRoles,
            instanceRoles: entry.instanceRoles,
          },
          {
            globalRoles: queries.globalRoles,
            instanceRoles: queries.instanceRoles,
          },
        ),
    );
    if (unsafeFields.length > 0) {
      const fieldNames = unsafeFields
        .map((entry) => appBuilder.nameFromId(entry.ref))
        .join(', ');
      throw new Error(
        `Model '${model.name}' marks field(s) [${fieldNames}] as filterable, but they ` +
          `are restricted to roles narrower than the list query's own roles. Filtering ` +
          `would let a caller who can list but not read these fields infer their values ` +
          `(e.g. via 'contains'/'lt'/'gt'). Either widen the field's roles to match (or ` +
          `exceed) the query's roles, narrow the query's roles to match the field's, or ` +
          `unmark the field as filterable.`,
      );
    }
  }

  // A list relation sorts the *target* model's rows, so both its OrderByInput
  // and its default sort come from that model rather than this one.
  const findRelationTargetModel = (ref: string): ModelConfig | undefined =>
    relationModels.find(({ relation }) => relation.foreignId === ref)?.model;

  const getOrderByInputRefForRelation = (ref: string): string => {
    const target = findRelationTargetModel(ref);
    if (!target) {
      throw new Error(
        `Foreign relation '${appBuilder.nameFromId(ref)}' on model '${model.name}' is marked orderable but its target model could not be resolved.`,
      );
    }
    // The OrderByInput type is emitted while building the target's own object
    // type file, so a disabled target would leave this reference dangling.
    if (!target.graphql.objectType.enabled) {
      throw new Error(
        `Foreign relation '${appBuilder.nameFromId(ref)}' on model '${model.name}' is marked orderable but its target model '${target.name}' does not have its GraphQL object type enabled.`,
      );
    }
    return getPothosPrismaOrderByInputTypeOutputName(target.name);
  };

  const toDefaultSort = (
    target: ModelConfig,
  ): { fieldName: string; direction: 'asc' | 'desc' }[] =>
    target.graphql.orderBy.defaultSort.map((entry) => ({
      fieldName: appBuilder.nameFromId(entry.ref),
      direction: entry.direction,
    }));

  const toExposedField = (entry: {
    ref: string;
    globalRoles: string[];
    instanceRoles: string[];
  }): { name: string; globalRoles: string[]; instanceRoles: string[] } => ({
    name: appBuilder.nameFromId(entry.ref),
    globalRoles: isAuthEnabled
      ? entry.globalRoles.map((r) => appBuilder.nameFromId(r))
      : [],
    instanceRoles: isAuthEnabled
      ? entry.instanceRoles.map((r) => appBuilder.nameFromId(r))
      : [],
  });

  return pothosTypesFileGenerator({
    id: `${model.id}-object-type`,
    fileName: `${kebabCase(model.name)}.object-type`,
    children: {
      primaryKey:
        (buildMutations || buildQuery) &&
        ModelUtils.getModelIdFields(model).length > 1
          ? pothosPrismaPrimaryKeyGenerator({
              modelName: model.name,
              order: 0,
            })
          : undefined,
      objectType: pothosPrismaObjectGenerator({
        modelName: model.name,
        exposedFields: [
          ...fields.map(toExposedField),
          ...foreignRelations.map((entry) => {
            // Resolved for every list relation, not just orderable ones: a
            // target with a default sort orders the relation even when it
            // exposes no `orderBy` argument.
            const target = findRelationTargetModel(entry.ref);
            return {
              ...toExposedField(entry),
              paginated: entry.paginated,
              orderByInputRef: entry.orderable
                ? getOrderByInputRefForRelation(entry.ref)
                : undefined,
              defaultSort: target ? toDefaultSort(target) : [],
              // Page size bounds the rows the relation returns, so it comes
              // from the target model just like the sort config above.
              defaultPageSize: target?.graphql.pagination.defaultPageSize,
              maxPageSize: target?.graphql.pagination.maxPageSize,
            };
          }),
          ...localRelations.map(toExposedField),
        ],
        order: 1,
      }),
      whereInput:
        hasListSurface && queries.where.enabled
          ? pothosPrismaWhereInputGenerator({
              modelName: model.name,
              order: 2,
              filterableFields: filterableFieldEntries.map((entry) =>
                appBuilder.nameFromId(entry.ref),
              ),
            })
          : undefined,
      orderByInput:
        (hasListSurface && queries.orderBy.enabled) ||
        requiresOrderByInputForRelation
          ? pothosPrismaOrderByInputGenerator({
              modelName: model.name,
              order: 3,
              sortableFields: sortableFieldEntries.map((entry) =>
                appBuilder.nameFromId(entry.ref),
              ),
            })
          : undefined,
    },
  });
}

function buildQueriesFileForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { graphql } = model;
  const { queries } = graphql;

  const hasListSurface = ModelUtils.hasListSurface(queries);

  if (!queries.get.enabled && !hasListSurface) {
    return undefined;
  }

  const { get, list, connection } = queries;

  const authConfig =
    appBuilder.definitionContainer.pluginStore.use(authConfigSpec);

  const isAuthEnabled = !!authConfig.getAuthConfig(
    appBuilder.projectDefinition,
  );

  const authorize = deriveQueryAuthorize(appBuilder, model, isAuthEnabled);

  // The policy encodes the whole read grant (global + instance roles); reads
  // filter through `policy.actions.read.where`. A policy exists whenever the model
  // declares authorizer roles. For a global-only read the filter is a no-op
  // (`read.where` returns unrestricted when the global grant is satisfied), so
  // referencing the policy uniformly is correct and simpler than the old
  // instance-roles-only query filter.
  const policyRef =
    isAuthEnabled && model.authorizer.roles.length > 0 ? model.name : undefined;

  const whereInputRef =
    hasListSurface && queries.where.enabled
      ? getPothosPrismaWhereInputTypeOutputName(model.name)
      : undefined;

  const orderByInputRef =
    hasListSurface && queries.orderBy.enabled
      ? getPothosPrismaOrderByInputTypeOutputName(model.name)
      : undefined;

  const { defaultPageSize, maxPageSize } = graphql.pagination;

  const defaultSort = graphql.orderBy.defaultSort.map((entry) => ({
    fieldName: appBuilder.nameFromId(entry.ref),
    direction: entry.direction,
  }));

  return pothosTypesFileGenerator({
    id: `${model.id}-queries`,
    fileName: `${kebabCase(model.name)}.queries`,
    children: {
      findQuery: get.enabled
        ? pothosPrismaFindQueryGenerator({
            order: 0,
            modelName: model.name,
            hasPrimaryKeyInputType:
              ModelUtils.getModelIdFields(model).length > 1,
            policyRef,
            children: {
              authorize,
            },
          })
        : undefined,
      listQuery: list.enabled
        ? pothosPrismaListQueryGenerator({
            order: 1,
            modelName: model.name,
            policyRef,
            whereInputRef,
            orderByInputRef,
            defaultSort,
            defaultPageSize,
            maxPageSize,
            children: {
              authorize,
            },
          })
        : undefined,
      countQuery:
        list.enabled && list.count.enabled
          ? pothosPrismaCountQueryGenerator({
              order: 2,
              modelName: model.name,
              policyRef,
              whereInputRef,
              children: {
                authorize,
              },
            })
          : undefined,
      connectionQuery: connection.enabled
        ? pothosPrismaConnectionQueryGenerator({
            order: 3,
            modelName: model.name,
            policyRef,
            whereInputRef,
            orderByInputRef,
            defaultSort,
            defaultPageSize,
            maxPageSize,
            children: {
              authorize,
            },
          })
        : undefined,
    },
  });
}

function buildMutationsFileForModel(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): GeneratorBundle | undefined {
  const { graphql, service } = model;
  const { mutations } = graphql;

  const buildMutations =
    mutations.create.enabled ||
    mutations.update.enabled ||
    mutations.delete.enabled;

  if (!buildMutations) {
    return undefined;
  }

  const { create, update, delete: del } = mutations;

  const authConfig =
    appBuilder.definitionContainer.pluginStore.use(authConfigSpec);

  const isAuthEnabled = !!authConfig.getAuthConfig(
    appBuilder.projectDefinition,
  );

  const sharedMutationConfig = {
    modelName: model.name,
    crudServiceRef: `prisma-data-service:${model.name}`,
  };

  return pothosTypesFileGenerator({
    id: `${model.id}-mutations`,
    fileName: `${kebabCase(model.name)}.mutations`,
    children: {
      create: create.enabled
        ? pothosPrismaCrudMutationGenerator({
            ...sharedMutationConfig,
            order: 0,
            name: `create${uppercaseFirstChar(model.name)}`,
            children: {
              authorize: deriveMutationAuthorize(
                appBuilder,
                model,
                service.create,
                isAuthEnabled,
              ),
            },
          })
        : undefined,
      update: update.enabled
        ? pothosPrismaCrudMutationGenerator({
            ...sharedMutationConfig,
            order: 1,
            name: `update${uppercaseFirstChar(model.name)}`,
            children: {
              authorize: deriveMutationAuthorize(
                appBuilder,
                model,
                service.update,
                isAuthEnabled,
              ),
            },
          })
        : undefined,
      delete: del.enabled
        ? pothosPrismaCrudMutationGenerator({
            ...sharedMutationConfig,
            order: 2,
            name: `delete${uppercaseFirstChar(model.name)}`,
            children: {
              authorize: deriveMutationAuthorize(
                appBuilder,
                model,
                service.delete,
                isAuthEnabled,
              ),
            },
          })
        : undefined,
    },
  });
}

function buildEnumFileForModel(
  enumFileId: string,
  enums: EnumConfig[],
  registerFilters: boolean,
): GeneratorBundle | undefined {
  if (enums.length === 0) {
    return undefined;
  }
  return pothosEnumsFileGenerator({
    id: enumFileId,
    name: `Enums`,
    children: {
      enums: enums.map((enumConfig) =>
        pothosPrismaEnumGenerator({
          enumName: enumConfig.name,
          valueDescriptions: Object.fromEntries(
            enumConfig.values.flatMap((v) =>
              v.description ? [[v.name, v.description]] : [],
            ),
          ),
          registerFilter: registerFilters,
        }),
      ),
    },
  });
}

export function buildGraphqlForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): GeneratorBundle[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  );

  const enums = appBuilder.projectDefinition.enums.filter(
    (e) => e.featureRef === featureId && e.isExposed,
  );

  const hasWhereFiltering = appBuilder.projectDefinition.models.some(
    (model) =>
      ModelUtils.hasListSurface(model.graphql.queries) &&
      model.graphql.queries.where.enabled,
  );

  return [
    ...models.flatMap((model) => [
      buildObjectTypeFile(appBuilder, model),
      buildQueriesFileForModel(appBuilder, model),
      buildMutationsFileForModel(appBuilder, model),
    ]),
    buildEnumFileForModel(`${featureId}-enums`, enums, hasWhereFiltering),
  ].filter(notEmpty);
}
