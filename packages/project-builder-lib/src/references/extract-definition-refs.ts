import type {
  DefinitionEntityNameResolver,
  PathInput,
  RefBuilderContext,
  ZodRefPayload,
} from './definition-ref-builder.js';
import type { DefinitionRefAnnotations } from './markers.js';
import type {
  DefinitionEntity,
  DefinitionReference,
  ReferencePath,
} from './types.js';

import { DefinitionRefBuilder } from './definition-ref-builder.js';
import {
  DefinitionReferenceMarker,
  REF_ANNOTATIONS_MARKER_SYMBOL,
} from './markers.js';

/**
 * Entity with a name resolver.
 */
export interface DefinitionEntityWithNameResolver
  extends Omit<DefinitionEntity, 'name'> {
  nameResolver: DefinitionEntityNameResolver;
}

/**
 * Context for storing references, entities, and builder context.
 */
export interface ZodRefContext {
  context: RefBuilderContext;
  references: DefinitionReference[];
  entitiesWithNameResolver: DefinitionEntityWithNameResolver[];
}

export function extractDefinitionRefsRecursive(
  value: unknown,
  context: ZodRefContext,
  path: ReferencePath,
): unknown {
  const builder = new DefinitionRefBuilder<unknown>(
    path,
    context.context,
    value,
  );

  if (value instanceof DefinitionReferenceMarker) {
    builder.addReference(value.reference);
    context.references.push(...builder.references);
    context.entitiesWithNameResolver.push(...builder.entitiesWithNameResolver);
    return value.value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    REF_ANNOTATIONS_MARKER_SYMBOL in value
  ) {
    const annotations = value[
      REF_ANNOTATIONS_MARKER_SYMBOL
    ] as DefinitionRefAnnotations;

    // Phase 1: Pre-register all provides slots at this level first.
    // This ensures slots are available before any parentRef lookups,
    // regardless of property iteration order.
    for (const entity of annotations.entities) {
      builder.preRegisterEntitySlot(entity);
    }

    for (const reference of annotations.references) {
      builder.preRegisterReferenceSlot(reference);
    }

    for (const slotPath of annotations.slotContextPaths ?? []) {
      builder.addPathToContext(
        slotPath.path as PathInput<unknown>,
        slotPath.slot,
      );
    }

    // Phase 2: Full processing (all parentRef lookups will now succeed)
    for (const entity of annotations.entities) {
      builder.addEntity(entity);
    }

    for (const reference of annotations.references) {
      builder.addReference(reference);
    }

    context.references.push(...builder.references);
    context.entitiesWithNameResolver.push(...builder.entitiesWithNameResolver);

    // Remove the marker symbol and process the clean object
    const { [REF_ANNOTATIONS_MARKER_SYMBOL]: _, ...cleanValue } = value;

    // Process the clean object recursively
    return Object.fromEntries(
      Object.entries(cleanValue).map(([key, childValue]) => [
        key,
        extractDefinitionRefsRecursive(childValue, context, [...path, key]),
      ]),
    );
  }

  // Run recursively for arrays first (arrays are also objects)
  if (Array.isArray(value)) {
    return value.map((element, i) =>
      extractDefinitionRefsRecursive(element, context, [...path, i]),
    );
  }

  // Run recursively for regular objects
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [
        key,
        extractDefinitionRefsRecursive(childValue, context, [...path, key]),
      ]),
    );
  }

  // Return primitive values as-is
  return value;
}

export function extractDefinitionRefs<T>(value: T): ZodRefPayload<T> {
  const refContext: ZodRefContext = {
    context: {
      pathMap: new Map(),
    },
    references: [],
    entitiesWithNameResolver: [],
  };

  const cleanData = extractDefinitionRefsRecursive(value, refContext, []);

  // Simple sanity check to make sure we don't have duplicate IDs
  const idSet = new Set<string>();
  for (const entity of refContext.entitiesWithNameResolver) {
    if (idSet.has(entity.id)) {
      throw new Error(`Duplicate ID found: ${entity.id}`);
    }
    idSet.add(entity.id);
  }

  return {
    data: cleanData as T,
    references: refContext.references,
    entitiesWithNameResolver: refContext.entitiesWithNameResolver,
  };
}
