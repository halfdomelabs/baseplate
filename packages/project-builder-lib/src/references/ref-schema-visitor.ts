import type { z } from 'zod';

import type {
  SchemaNodeVisitor,
  SchemaWalkContext,
} from '#src/parser/walk-data-with-schema.js';

import type { DefinitionRefMeta } from './definition-ref-registry.js';
import type { ReferencePath } from './types.js';

import { definitionRefRegistry } from './definition-ref-registry.js';

export interface RefWalkContext extends SchemaWalkContext {
  /** Slot paths active at this node — maps slot symbol ID → path where that slot was registered. */
  readonly activeSlotPaths: ReadonlyMap<symbol, ReferencePath>;
}

/**
 * A typed collector for the ref subsystem.
 */
export interface RefSchemaCollector<
  TKind extends DefinitionRefMeta['kind'] = DefinitionRefMeta['kind'],
> {
  readonly kind: TKind;
  visit(
    meta: DefinitionRefMeta & { kind: TKind },
    data: unknown,
    ctx: RefWalkContext,
  ): void;
}

/**
 * Creates a typed `RefSchemaCollector` with the correct narrowed `meta` type
 * inferred from the `kind` field.
 */
export function createRefSchemaCollector<
  TKind extends DefinitionRefMeta['kind'],
>(collector: RefSchemaCollector<TKind>): RefSchemaCollector<TKind> {
  return collector;
}

/**
 * Creates a `SchemaNodeVisitor` for the ref subsystem.
 *
 * Uses the `visit()` + cleanup pattern: each call to `visit()` may return a
 * cleanup function that restores slot scope state after children are walked,
 * analogous to React's `useEffect` cleanup.
 *
 * When a `ref-context` annotation is encountered, the active slot map is
 * extended for all descendant nodes and restored on cleanup.
 */
export function createRefSchemaVisitor(
  collectors: readonly RefSchemaCollector[],
): SchemaNodeVisitor {
  // Current active slot paths — updated when entering ref-context nodes,
  // restored via cleanup closures on exit.
  let activeSlotPaths: ReadonlyMap<symbol, ReferencePath> = new Map();

  return {
    visit(
      schema: z.ZodType,
      data: unknown,
      ctx: SchemaWalkContext,
    ): (() => void) | undefined {
      const metaList = definitionRefRegistry.getAll(schema);
      if (metaList.length === 0) return undefined;

      const slotPathsAtEntry = activeSlotPaths;

      for (const meta of metaList) {
        // Extend slot scope if this is a ref-context annotation
        if (meta.kind === 'ref-context') {
          const contextMeta = meta;
          const extended = new Map(activeSlotPaths);
          for (const slot of contextMeta.slots) {
            extended.set(slot.id, ctx.path);
          }
          activeSlotPaths = extended;
        }

        const refCtx: RefWalkContext = {
          path: ctx.path,
          activeSlotPaths,
        };

        for (const collector of collectors) {
          if (collector.kind === meta.kind) {
            collector.visit(meta as never, data, refCtx);
          }
        }
      }

      // Return cleanup only if slot scope was extended
      if (activeSlotPaths !== slotPathsAtEntry) {
        return () => {
          activeSlotPaths = slotPathsAtEntry;
        };
      }

      return undefined;
    },
  };
}
