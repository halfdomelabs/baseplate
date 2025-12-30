import type {
  DefinitionEntityAnnotation,
  DefinitionExpressionAnnotation,
  DefinitionRefAnnotations,
  DefinitionReferenceAnnotation,
  DefinitionSlotAnnotation,
} from './markers.js';
import type { ReferencePath } from './types.js';

import {
  DefinitionExpressionMarker,
  DefinitionReferenceMarker,
  REF_ANNOTATIONS_MARKER_SYMBOL,
} from './markers.js';

/**
 * Result of collecting refs before slot resolution.
 */
export interface CollectedRefs {
  /**
   * All input entities from the definition.
   */
  entities: DefinitionEntityAnnotation[];
  /**
   * All input references from the definition.
   */
  references: DefinitionReferenceAnnotation[];
  /**
   * All slots from the definition.
   */
  slots: DefinitionSlotAnnotation[];
  /**
   * All expression annotations from the definition.
   */
  expressions: DefinitionExpressionAnnotation[];
}

function collectRefAnnotationsRecursive(
  pathPrefix: ReferencePath,
  value: unknown,
): CollectedRefs | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof DefinitionReferenceMarker) {
    return {
      entities: [],
      references: [
        { ...value.reference, path: [...pathPrefix, ...value.reference.path] },
      ],
      slots: [],
      expressions: [],
    };
  }
  if (value instanceof DefinitionExpressionMarker) {
    return {
      entities: [],
      references: [],
      slots: [],
      expressions: [
        {
          ...value.expression,
          value: value.value,
          path: [...pathPrefix, ...value.expression.path],
        },
      ],
    };
  }
  const collected: CollectedRefs = {
    entities: [],
    references: [],
    slots: [],
    expressions: [],
  };
  if (Array.isArray(value)) {
    for (const [i, element] of value.entries()) {
      const childCollected = collectRefAnnotationsRecursive(
        [...pathPrefix, i],
        element,
      );
      if (childCollected) {
        collected.entities.push(...childCollected.entities);
        collected.references.push(...childCollected.references);
        collected.slots.push(...childCollected.slots);
        collected.expressions.push(...childCollected.expressions);
      }
    }
    return collected;
  }
  if (typeof value === 'object') {
    if (REF_ANNOTATIONS_MARKER_SYMBOL in value) {
      const annotations = value[
        REF_ANNOTATIONS_MARKER_SYMBOL
      ] as DefinitionRefAnnotations;
      collected.entities.push(
        ...annotations.entities.map((entity) => ({
          ...entity,
          path: [...pathPrefix, ...entity.path],
        })),
      );
      collected.references.push(
        ...annotations.references.map((reference) => ({
          ...reference,
          path: [...pathPrefix, ...reference.path],
        })),
      );
      collected.slots.push(
        ...annotations.slots.map((slot) => ({
          ...slot,
          path: [...pathPrefix, ...slot.path],
        })),
      );
    }
    for (const [key, childValue] of Object.entries(value)) {
      if (typeof key !== 'string') continue;
      const childCollected = collectRefAnnotationsRecursive(
        [...pathPrefix, key],
        childValue,
      );
      if (childCollected) {
        collected.entities.push(...childCollected.entities);
        collected.references.push(...childCollected.references);
        collected.slots.push(...childCollected.slots);
        collected.expressions.push(...childCollected.expressions);
      }
    }
    return collected;
  }
  return undefined;
}

export function collectRefs(value: unknown): CollectedRefs {
  return (
    collectRefAnnotationsRecursive([], value) ?? {
      entities: [],
      references: [],
      slots: [],
      expressions: [],
    }
  );
}
