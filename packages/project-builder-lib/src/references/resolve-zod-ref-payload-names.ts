import { keyBy, mapValues } from 'es-toolkit';
import toposort from 'toposort';

import type { ZodRefPayload } from './ref-builder';
import type { DefinitionEntity, ResolvedZodRefPayload } from './types';

/**
 * Options for resolving entity names in a ZodRefPayload.
 */
export interface ResolveZodRefPayloadNamesOptions {
  /**
   * If true, skip reference name resolution. (Used when we are deserializing since
   * the references are already resolved to names)
   */
  skipReferenceNameResolution?: boolean;
  /**
   * If true, allow invalid references. (Used for testing deletes)
   */
  allowInvalidReferences?: boolean;
}

/**
 * Resolves entity names in a ZodRefPayload.
 *
 * @param payload - The ZodRefPayload to resolve.
 * @param options - The options for resolving entity names.
 *
 * @template T - The type of the payload.
 */
export function resolveZodRefPayloadNames<T>(
  payload: ZodRefPayload<T>,
  {
    skipReferenceNameResolution = false,
    allowInvalidReferences = false,
  }: ResolveZodRefPayloadNamesOptions = {},
): ResolvedZodRefPayload<T> {
  const { entitiesWithNameResolver, references, data } = payload;
  const entitiesById = keyBy(entitiesWithNameResolver, (entity) => entity.id);
  const resolvedEntitiesById = new Map<string, DefinitionEntity>();
  // sort entities by dependency order
  const orderedEntities = toposort.array(
    entitiesWithNameResolver.map((entity) => entity.id),
    entitiesWithNameResolver.flatMap((entity) => {
      const entityIds = entity.nameResolver.idsToResolve ?? {};
      return Object.values(entityIds)
        .flat()
        .filter((id) => id in entitiesById)
        .map((id) => [id, entity.id] as [string, string]);
    }),
  );

  function resolveIdToName(id: string): string {
    if (skipReferenceNameResolution) {
      return id;
    }
    const entity = resolvedEntitiesById.get(id);
    if (!entity) {
      if (allowInvalidReferences) {
        return id;
      }
      throw new Error(`Could not resolve entity name for id: ${id}`);
    }
    return entity.name;
  }

  for (const id of orderedEntities) {
    const { nameResolver, ...rest } = entitiesById[id];
    const resolvedIds = mapValues(nameResolver.idsToResolve ?? {}, (idOrIds) =>
      Array.isArray(idOrIds)
        ? idOrIds.map((id) => resolveIdToName(id))
        : resolveIdToName(idOrIds),
    );
    resolvedEntitiesById.set(rest.id, {
      ...rest,
      name: nameResolver.resolveName(resolvedIds),
    });
  }

  return {
    entities: [...resolvedEntitiesById.values()],
    references,
    data,
  };
}
