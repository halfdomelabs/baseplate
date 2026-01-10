import z from 'zod';

import { libraryTypeSpec } from '#src/specs/packages/library-type-spec.js';

import type { baseLibrarySchema } from './base.js';

import { definitionSchema } from '../creator/schema-creator.js';
import { libraryEntityType } from './types.js';

export const createLibrarySchema = definitionSchema((ctx) =>
  ctx.refContext({ librarySlot: libraryEntityType }, ({ librarySlot }) => {
    const packageTypes = ctx.plugins.use(libraryTypeSpec);
    const schemas = [...packageTypes.schemaCreators.values()].map((entry) =>
      entry.definitionSchema(ctx, { librarySlot }),
    );
    return ctx.withEnt(
      z.discriminatedUnion(
        'type',
        schemas as [typeof baseLibrarySchema, ...(typeof baseLibrarySchema)[]],
      ),
      {
        type: libraryEntityType,
        provides: librarySlot,
      },
    );
  }),
);
