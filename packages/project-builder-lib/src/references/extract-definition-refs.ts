import type { z } from 'zod';

import { get } from 'es-toolkit/compat';

import { walkSchemaWithData } from '#src/parser/schema-walker.js';

import type { DefinitionEntityWithNameResolver } from './definition-ref-builder.js';
import type {
  DefinitionEntityAnnotation,
  DefinitionExpressionAnnotation,
  DefinitionReferenceAnnotation,
  DefinitionSlotAnnotation,
} from './definition-ref-registry.js';
import type { DefinitionExpression } from './expression-types.js';
import type { DefinitionReference, ReferencePath } from './types.js';

import {
  createRefSchemaCollector,
  createRefSchemaVisitor,
} from './ref-schema-visitor.js';
import { findNearestAncestorSlot, resolveSlots } from './resolve-slots.js';

/**
 * Payload returned after parsing, containing the data, references, entities, and expressions.
 *
 * @template TData - The type of the parsed data.
 */
export interface ExtractDefinitionRefsPayload<TData> {
  data: TData;
  references: DefinitionReference[];
  entitiesWithNameResolver: DefinitionEntityWithNameResolver[];
  expressions: DefinitionExpression[];
}

type RefContextSlotSym = symbol;

/**
 * Extracts definition refs by walking the schema structure alongside the parsed data.
 *
 * Flow:
 * 1. Walk schema+data in parallel using registered collectors
 * 2. Resolve all slot references to actual paths
 * 3. Resolve entity, reference, and expression parent/slot paths
 * 4. Validate no duplicate IDs
 *
 * @param schema - The Zod schema used to validate the data
 * @param value - The parsed value (output of schema.parse())
 * @returns The extracted refs with the original data unchanged
 */
export function extractDefinitionRefs<T>(
  schema: z.ZodType,
  value: T,
): ExtractDefinitionRefsPayload<T> {
  const entities: DefinitionEntityAnnotation[] = [];
  const references: DefinitionReferenceAnnotation[] = [];
  const slots: DefinitionSlotAnnotation[] = [];
  const expressionAnnotations: DefinitionExpressionAnnotation[] = [];

  // Entity collector: validates ID and captures name resolver
  const entityCollector = createRefSchemaCollector({
    kind: 'entity',
    visit(meta, data, context): void {
      if (data === null || data === undefined || typeof data !== 'object')
        return;
      const id = get(data, meta.idPath) as unknown;
      if (typeof id !== 'string' || !id || !meta.type.isId(id)) {
        throw new Error(
          `Unable to find valid id field '${meta.idPath.join('.')}' in entity ${meta.type.name} at path ${context.path.join('.')}`,
        );
      }

      const nameResolver = (() => {
        if (meta.getNameResolver) {
          return meta.getNameResolver(data);
        }
        if (
          !('name' in data) ||
          typeof (data as Record<string, unknown>).name !== 'string'
        ) {
          throw new Error(
            `Unable to find string name field in entity ${meta.type.name} at path ${context.path.join('.')}`,
          );
        }
        return (data as Record<string, unknown>).name as string;
      })();

      entities.push({
        id,
        idPath: meta.idPath,
        path: context.path,
        type: meta.type,
        nameResolver,
        parentSlot: meta.parentSlot,
        provides: meta.provides,
      });
    },
  });

  // Reference collector: records non-empty string references
  const referenceCollector = createRefSchemaCollector({
    kind: 'reference',
    visit(meta, data, context): void {
      // Skip empty/undefined references
      if (typeof data !== 'string' || !data) return;
      references.push({
        path: context.path,
        type: meta.type,
        onDelete: meta.onDelete,
        parentSlot: meta.parentSlot,
        provides: meta.provides,
      });
    },
  });

  // Slot collector: records which ref-context scopes exist and where
  const slotCollector = createRefSchemaCollector({
    kind: 'ref-context',
    visit(meta, _data, context): void {
      for (const slot of meta.slots) {
        slots.push({ path: context.path, slot });
      }
    },
  });

  // Expression collector: records expression annotations
  const expressionCollector = createRefSchemaCollector({
    kind: 'expression',
    visit(meta, data, context): void {
      if (data === undefined || data === null) return;
      expressionAnnotations.push({
        path: context.path,
        value: data,
        parser: meta.parser,
        slots: meta.slots,
      });
    },
  });

  // Walk schema+data in parallel to collect all metadata
  const refVisitor = createRefSchemaVisitor([
    entityCollector,
    referenceCollector,
    slotCollector,
    expressionCollector,
  ]);
  walkSchemaWithData(schema, value, [refVisitor]);

  // Resolve all slots to paths (reuses existing slot resolution logic)
  const resolvedSlots = resolveSlots({
    entities,
    references,
    slots,
    expressions: expressionAnnotations,
  });

  // Helper to resolve a parentSlot to a path
  function resolveParentPath(
    parentSlot: { id: RefContextSlotSym },
    path: ReferencePath,
  ): ReferencePath | undefined {
    const resolvedSlot = findNearestAncestorSlot(
      resolvedSlots.get(parentSlot.id),
      path,
    );
    if (!resolvedSlot) {
      throw new Error(
        `Could not resolve parent path from ${path.join('.')} for slot ${String(parentSlot.id.description)}`,
      );
    }
    return resolvedSlot.resolvedPath;
  }

  const entitiesWithNameResolver: DefinitionEntityWithNameResolver[] =
    entities.map((entity) => ({
      id: entity.id,
      idPath: entity.idPath,
      nameResolver: entity.nameResolver,
      type: entity.type,
      path: entity.path,
      parentPath: entity.parentSlot
        ? resolveParentPath(entity.parentSlot, entity.path)
        : undefined,
    }));

  const resolvedReferences: DefinitionReference[] = references.map(
    (reference) => ({
      type: reference.type,
      path: reference.path,
      onDelete: reference.onDelete,
      parentPath: reference.parentSlot
        ? resolveParentPath(reference.parentSlot, reference.path)
        : undefined,
    }),
  );

  // Resolve expression slots
  const expressions: DefinitionExpression[] = expressionAnnotations.map(
    (expression) => {
      const resolvedSlotPaths: Record<string, ReferencePath> = {};

      if (expression.slots) {
        for (const [key, slot] of Object.entries(
          expression.slots as Record<string, { id: RefContextSlotSym }>,
        )) {
          const resolvedSlot = findNearestAncestorSlot(
            resolvedSlots.get(slot.id),
            expression.path,
          );
          if (!resolvedSlot) {
            throw new Error(
              `Could not resolve expression slot "${key}" at path ${expression.path.join('.')}`,
            );
          }
          resolvedSlotPaths[key] = resolvedSlot.resolvedPath;
        }
      }

      return {
        path: expression.path,
        value: expression.value,
        parser: expression.parser,
        resolvedSlots: resolvedSlotPaths,
      };
    },
  );

  // Validate no duplicate entity IDs
  const idSet = new Set<string>();
  for (const entity of entities) {
    if (idSet.has(entity.id)) {
      throw new Error(`Duplicate ID found: ${entity.id}`);
    }
    idSet.add(entity.id);
  }

  return {
    data: value,
    references: resolvedReferences,
    entitiesWithNameResolver,
    expressions,
  };
}
