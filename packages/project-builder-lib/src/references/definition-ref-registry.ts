import type { z } from 'zod';

import type { DefinitionEntityNameResolver } from './definition-ref-builder.js';
import type {
  ExpressionSlotMap,
  RefExpressionParser,
} from './expression-types.js';
import type { RefContextSlot } from './ref-context-slot.js';
import type {
  DefinitionEntityType,
  ReferenceOnDeleteAction,
  ReferencePath,
} from './types.js';

export interface EntitySchemaMeta {
  readonly kind: 'entity';
  readonly type: DefinitionEntityType;
  readonly idPath: ReferencePath;

  readonly getNameResolver?: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
  ) => DefinitionEntityNameResolver | string;
  readonly parentSlot?: RefContextSlot;
  readonly provides?: RefContextSlot;
}

export interface ReferenceSchemaMeta {
  readonly kind: 'reference';
  readonly type: DefinitionEntityType;
  readonly onDelete: ReferenceOnDeleteAction;
  readonly parentSlot?: RefContextSlot;
  readonly provides?: RefContextSlot;
}

export interface ExpressionSchemaMeta {
  readonly kind: 'expression';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly parser: RefExpressionParser<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly slots?: ExpressionSlotMap<any>;
}

export interface RefContextSchemaMeta {
  readonly kind: 'ref-context';
  readonly slots: RefContextSlot[];
}

// ---------------------------------------------------------------------------
// Runtime annotation types (populated during schema+data walk)
// ---------------------------------------------------------------------------

/**
 * An entity annotation collected during the schema walk.
 * Represents a single entity instance found in the parsed data.
 */
export interface DefinitionEntityAnnotation {
  path: ReferencePath;
  id: string;
  idPath: ReferencePath;
  type: DefinitionEntityType;
  nameResolver: DefinitionEntityNameResolver | string;
  parentSlot?: RefContextSlot;
  provides?: RefContextSlot;
}

/**
 * A reference annotation collected during the schema walk.
 */
export interface DefinitionReferenceAnnotation {
  path: ReferencePath;
  type: DefinitionEntityType;
  onDelete: ReferenceOnDeleteAction;
  parentSlot?: RefContextSlot;
  provides?: RefContextSlot;
}

/**
 * A slot annotation collected during the schema walk.
 */
export interface DefinitionSlotAnnotation {
  path: ReferencePath;
  slot: RefContextSlot;
}

/**
 * An expression annotation collected during the schema walk.
 */
export interface DefinitionExpressionAnnotation {
  path: ReferencePath;
  value: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parser: RefExpressionParser<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slots?: ExpressionSlotMap<any>;
}

/**
 * All annotations collected during a single schema+data walk.
 */
export interface CollectedRefs {
  entities: DefinitionEntityAnnotation[];
  references: DefinitionReferenceAnnotation[];
  slots: DefinitionSlotAnnotation[];
  expressions: DefinitionExpressionAnnotation[];
}

// ---------------------------------------------------------------------------
// Schema metadata types (stored in the registry on schema instances)
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all Baseplate schema metadata types.
 *
 * New metadata types can be added by:
 * 1. Adding a new interface with a unique `kind`
 * 2. Adding it to this union
 * 3. Implementing a `SchemaWalkerCollector` that handles the new kind
 */
export type DefinitionRefMeta =
  | EntitySchemaMeta
  | ReferenceSchemaMeta
  | ExpressionSchemaMeta
  | RefContextSchemaMeta;

/**
 * Global registry that stores Baseplate metadata on Zod schema instances.
 *
 * Uses a plain WeakMap to avoid Zod's `$replace<Meta, S>` type substitution
 * which causes "type instantiation excessively deep" errors with complex unions.
 *
 * Stores an array of metadata per schema to support schemas that carry multiple
 * annotations (e.g. a schema that is both an `entity` and a `ref-context`).
 *
 * Used by `withEnt`, `withRef`, `withExpression`, and `refContext` to attach
 * metadata to schema nodes. The parallel schema+data walker reads this registry
 * to extract entity/reference/expression information after validation.
 */
export const definitionRefRegistry: {
  add(schema: z.ZodType, meta: DefinitionRefMeta): void;
  getAll(schema: z.ZodType): DefinitionRefMeta[];
  has(schema: z.ZodType): boolean;
} = (() => {
  const map = new WeakMap<z.ZodType, DefinitionRefMeta[]>();
  return {
    add(schema: z.ZodType, meta: DefinitionRefMeta): void {
      const existing = map.get(schema);
      if (existing) {
        if (
          (meta.kind === 'entity' || meta.kind === 'reference') &&
          existing.some((e) => e.kind === meta.kind && e.type === meta.type)
        ) {
          throw new Error(
            `Duplicate definition ref metadata kind "${meta.kind}" for type "${meta.type.name}" on the same schema instance. ` +
              `This usually means a shared/module-level schema was passed to withEnt/withRef multiple times. ` +
              `Create a fresh schema instance instead.`,
          );
        }
        existing.push(meta);
      } else {
        map.set(schema, [meta]);
      }
    },
    getAll(schema: z.ZodType): DefinitionRefMeta[] {
      return map.get(schema) ?? [];
    },
    has(schema: z.ZodType): boolean {
      return map.has(schema);
    },
  };
})();
