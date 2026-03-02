import type { z } from 'zod';

import type { EntitySchemaMeta } from '#src/references/definition-ref-registry.js';

import { getSchemaChildren } from '#src/parser/schema-structure.js';
import { definitionRefRegistry } from '#src/references/definition-ref-registry.js';

type PlainObject = Record<string, unknown>;

/**
 * Returns the first EntitySchemaMeta found on the given schema or any inner
 * schema reachable through wrappers (optional/nullable/default).
 */
export function getEntityMeta(schema: z.ZodType): EntitySchemaMeta | undefined {
  const meta = definitionRefRegistry
    .getAll(schema)
    .find((m): m is EntitySchemaMeta => m.kind === 'entity');
  if (meta) {
    return meta;
  }
  const children = getSchemaChildren(schema, undefined, []);
  if (children.kind === 'wrapper') {
    return getEntityMeta(children.innerSchema);
  }
  return undefined;
}

/**
 * Resolves the name of an entity from its serialized (name-based) data using
 * the entity schema's name resolver.
 *
 * Since the data is already serialized, reference IDs are already names —
 * no cross-entity resolution or toposort is needed.
 */
export function getEntityName(
  entityMeta: EntitySchemaMeta,
  item: PlainObject,
): string {
  if (!entityMeta.getNameResolver) {
    return item.name as string;
  }
  const resolver = entityMeta.getNameResolver(item);
  if (typeof resolver === 'string') {
    return resolver;
  }
  // In serialized data, reference IDs are already names — pass them through
  const resolvedIds = Object.fromEntries(
    Object.entries(resolver.idsToResolve ?? {}).map(([key, idOrIds]) => [
      key,
      idOrIds,
    ]),
  );
  return resolver.resolveName(resolvedIds);
}
