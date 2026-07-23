/**
 * Unified policy compiler — produces ONE `createModelPolicy` descriptor per
 * model, replacing the former two-compiler split (authorizer + query-filter).
 *
 * For each model with authorizer roles it:
 *  1. resolves `via` delegation links and relation-filter contexts from schema,
 *  2. lowers each role's expression to a `createModelPolicy` role-tree call
 *     (`r.match`/`r.via`/`r.all`/… — see `policy-lowering.ts`),
 *  3. builds the `actions` map by consolidating the scattered grants:
 *     - `read`   ← `model.graphql.queries.{globalRoles, instanceRoles}`
 *     - `create` ← `model.service.create.globalRoles` (no instance roles)
 *     - `update` ← `model.service.update.{globalRoles, instanceRoles}`
 *     - `delete` ← `model.service.delete.{globalRoles, instanceRoles}`
 */

import type { ModelConfig } from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { prismaModelPolicyGenerator } from '@baseplate-dev/fastify-generators';
import {
  ModelUtils,
  parseAuthorizerExpression,
} from '@baseplate-dev/project-builder-lib';
import { lowercaseFirstChar } from '@baseplate-dev/utils';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';
import type {
  PolicyLoweringContext,
  ResolvedViaLink,
} from './policy-lowering.js';
import type {
  QueryFilterCodeContext,
  ResolvedNestedQueryFilter,
} from './query-filter-codegen.js';

import { lowerExpressionToRoleTree } from './policy-lowering.js';

/** A grant on the `actions` map: role names + global role names. */
interface ActionGrantDescriptor {
  /** Instance role names (reference the policy's own roles). */
  roles: string[];
  /** Global/principal role names. */
  globalRoles: string[];
}

/** A lowered role: its name + the `r.*(...)` builder-call body. */
interface LoweredRole {
  name: string;
  /** The role-tree builder call (e.g. `r.match(...)`). */
  roleTreeCode: string;
  /** Foreign policy model names referenced via delegation (for imports/deps). */
  foreignPolicyModelNames: string[];
}

/**
 * Resolve `via` delegation links for a model's nested role refs. Mirrors the old
 * authorizer resolution, but the target is the parent POLICY var (`blogPolicy`),
 * not an authorizer var.
 */
function resolveViaLinks(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  nestedRoleRefs: { relationName: string }[],
): { resolvedVia: Map<string, ResolvedViaLink>; foreignModelNames: string[] } {
  const resolvedVia = new Map<string, ResolvedViaLink>();
  const foreignModelNames: string[] = [];

  for (const { relationName } of nestedRoleRefs) {
    if (resolvedVia.has(relationName)) continue;

    const relation = model.model.relations.find((r) => r.name === relationName);
    if (!relation) {
      throw new Error(
        `Relation '${relationName}' not found on model '${model.name}'`,
      );
    }
    if (relation.references.length !== 1) {
      throw new Error(
        `Relation '${relationName}' on model '${model.name}' has ${relation.references.length} FK references. Delegation (r.via) only supports single-key relations.`,
      );
    }

    const fkFieldName = appBuilder.nameFromId(relation.references[0].localRef);
    if (!fkFieldName) {
      throw new Error(
        `Could not resolve FK field for relation '${relationName}' on model '${model.name}'`,
      );
    }

    const foreignModel = ModelUtils.byIdOrThrow(
      appBuilder.projectDefinition,
      relation.modelRef,
    );

    resolvedVia.set(relationName, {
      targetPolicyVar: `${lowercaseFirstChar(foreignModel.name)}Policy`,
      fkFieldName,
      relationName,
    });

    if (!foreignModelNames.includes(foreignModel.name)) {
      foreignModelNames.push(foreignModel.name);
    }
  }

  return { resolvedVia, foreignModelNames };
}

/**
 * Resolve relation-filter contexts (for the `r.where` membership fallback).
 * Searches local relations (FK on this model) and reverse relations (FK on
 * another model pointing here via `foreignRelationName`).
 */
function resolveRelationFilterContext(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
  relationFilterRefs: { relationName: string }[],
): QueryFilterCodeContext {
  const resolvedFilters = new Map<string, ResolvedNestedQueryFilter>();

  for (const { relationName } of relationFilterRefs) {
    if (resolvedFilters.has(relationName)) continue;

    // The where form nests under the relation FIELD name directly, so it does
    // not need FK resolution — the relation name is enough for `{ rel: {some} }`.
    const localRelation = model.model.relations.find(
      (r) => r.name === relationName,
    );
    if (localRelation) {
      const foreignModel = ModelUtils.byIdOrThrow(
        appBuilder.projectDefinition,
        localRelation.modelRef,
      );
      resolvedFilters.set(relationName, {
        relationFieldName: relationName,
        foreignModelName: foreignModel.name,
        foreignQueryFilterVar: `${lowercaseFirstChar(foreignModel.name)}Policy`,
      });
      continue;
    }

    // Reverse relation: another model points here.
    let found = false;
    for (const otherModel of appBuilder.projectDefinition.models) {
      const foreignRel = otherModel.model.relations.find(
        (r) =>
          r.modelRef === model.id && r.foreignRelationName === relationName,
      );
      if (foreignRel) {
        resolvedFilters.set(relationName, {
          relationFieldName: relationName,
          foreignModelName: otherModel.name,
          foreignQueryFilterVar: `${lowercaseFirstChar(otherModel.name)}Policy`,
        });
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error(
        `Relation '${relationName}' (relation filter) not found on model '${model.name}' or as a reverse relation`,
      );
    }
  }

  return { resolvedFilters };
}

/** Map grant role-id refs to names; instance roles resolve against authorizer roles. */
function mapGlobalRoles(
  appBuilder: BackendAppEntryBuilder,
  roleRefs: string[],
): string[] {
  return roleRefs.map((r) => appBuilder.nameFromId(r));
}

function mapInstanceRoles(model: ModelConfig, roleRefs: string[]): string[] {
  return roleRefs.map((roleRef) => {
    const authRole = model.authorizer.roles.find(
      (r) => r.id === roleRef || r.name === roleRef,
    );
    if (!authRole) {
      throw new Error(
        `Instance role '${roleRef}' not found in model '${model.name}' authorizer roles.`,
      );
    }
    return authRole.name;
  });
}

/** Build the `actions` map by consolidating read (graphql) + CRUD (service) grants. */
function buildActionsMap(
  appBuilder: BackendAppEntryBuilder,
  model: ModelConfig,
): Record<string, ActionGrantDescriptor> {
  const actions: Record<string, ActionGrantDescriptor> = {};

  // read — single grant on graphql.queries (cannot diverge across get/list/count).
  const { queries } = model.graphql;
  actions.read = {
    roles: mapInstanceRoles(model, queries.instanceRoles),
    globalRoles: mapGlobalRoles(appBuilder, queries.globalRoles),
  };

  // create — global roles only (schema has no instanceRoles on create).
  if (model.service.create.enabled) {
    actions.create = {
      roles: [],
      globalRoles: mapGlobalRoles(appBuilder, model.service.create.globalRoles),
    };
  }
  if (model.service.update.enabled) {
    actions.update = {
      roles: mapInstanceRoles(model, model.service.update.instanceRoles),
      globalRoles: mapGlobalRoles(appBuilder, model.service.update.globalRoles),
    };
  }
  if (model.service.delete.enabled) {
    actions.delete = {
      roles: mapInstanceRoles(model, model.service.delete.instanceRoles),
      globalRoles: mapGlobalRoles(appBuilder, model.service.delete.globalRoles),
    };
  }

  return actions;
}

/**
 * Build a `createModelPolicy` generator bundle for every model in the feature
 * that declares authorizer roles.
 */
export function buildPoliciesForFeature(
  appBuilder: BackendAppEntryBuilder,
  featureId: string,
): GeneratorBundle[] {
  const models = ModelUtils.getModelsForFeature(
    appBuilder.projectDefinition,
    featureId,
  );

  return models
    .filter((model) => model.authorizer.roles.length > 0)
    .map((model) => {
      const primaryKeyFields = ModelUtils.getPrimaryKeyFields(model);
      if (primaryKeyFields.length !== 1) {
        throw new Error(
          `Model '${model.name}' must have exactly one primary key field to use a model policy. Found ${primaryKeyFields.length}.`,
        );
      }
      const idFieldName = primaryKeyFields[0].name;

      // Collect nested + relation-filter refs across all roles.
      const parsedRoles = model.authorizer.roles.map((role) => ({
        role,
        parsed: parseAuthorizerExpression(role.expression),
      }));
      const allNestedRefs = parsedRoles.flatMap((r) => r.parsed.nestedRoleRefs);
      const allRelationFilterRefs = parsedRoles.flatMap(
        (r) => r.parsed.relationFilterRefs,
      );

      const { resolvedVia, foreignModelNames } =
        allNestedRefs.length > 0
          ? resolveViaLinks(appBuilder, model, allNestedRefs)
          : {
              resolvedVia: new Map<string, ResolvedViaLink>(),
              foreignModelNames: [] as string[],
            };

      const queryFilterContext =
        allRelationFilterRefs.length > 0
          ? resolveRelationFilterContext(
              appBuilder,
              model,
              allRelationFilterRefs,
            )
          : undefined;

      const loweringContext: PolicyLoweringContext = {
        resolvedVia,
        queryFilterContext,
      };

      const roles: LoweredRole[] = parsedRoles.map(({ role, parsed }) => {
        const nestedForRole = new Set(
          parsed.nestedRoleRefs.map((n) => n.relationName),
        );
        const foreignForRole = new Set(
          [...resolvedVia.entries()]
            .filter(([rel]) => nestedForRole.has(rel))
            .map(([, link]) => link.targetPolicyVar),
        );
        // Recover the foreign MODEL names for this role's deps.
        const foreignPolicyModelNames = foreignModelNames.filter((m) =>
          foreignForRole.has(`${lowercaseFirstChar(m)}Policy`),
        );

        return {
          name: role.name,
          roleTreeCode: lowerExpressionToRoleTree(parsed.ast, loweringContext),
          foreignPolicyModelNames,
        };
      });

      return prismaModelPolicyGenerator({
        modelName: model.name,
        idFieldName,
        foreignPolicyModelNames: foreignModelNames,
        roles,
        actions: buildActionsMap(appBuilder, model),
      });
    });
}
