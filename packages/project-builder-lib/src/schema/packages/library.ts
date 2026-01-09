import z from 'zod';

import { libraryTypeSpec } from '#src/compiler/index.js';

import type { basePackageSchema } from './base.js';

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
        schemas as [typeof basePackageSchema, ...(typeof basePackageSchema)[]],
      ),
      {
        type: libraryEntityType,
        provides: librarySlot,
      },
    );
  }),
);
