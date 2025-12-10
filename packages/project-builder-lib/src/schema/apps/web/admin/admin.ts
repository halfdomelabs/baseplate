import { z } from 'zod';

import type { def } from '#src/schema/index.js';

import { appEntityType } from '#src/schema/apps/types.js';
import { authRoleEntityType } from '#src/schema/auth/index.js';
import { definitionSchemaWithSlots } from '#src/schema/creator/schema-creator.js';

import { createAdminCrudSectionSchema } from './sections/crud.js';
import { adminSectionEntityType } from './sections/types.js';

export const createWebAdminSectionSchema = definitionSchemaWithSlots(
  { appSlot: appEntityType },
  (ctx, { appSlot }) =>
    ctx.refContext(
      { adminSectionSlot: adminSectionEntityType },
      ({ adminSectionSlot }) =>
        ctx.withRefBuilder(
          createAdminCrudSectionSchema(ctx, { adminSectionSlot }),
          (builder) => {
            builder.addEntity({
              type: adminSectionEntityType,
              parentRef: appSlot,
              provides: adminSectionSlot,
            });
          },
        ),
    ),
);

export type WebAdminSectionConfig = def.InferOutput<
  typeof createWebAdminSectionSchema
>;

export type WebAdminSectionConfigInput = def.InferInput<
  typeof createWebAdminSectionSchema
>;

export const createAdminAppSchema = definitionSchemaWithSlots(
  { appSlot: appEntityType },
  (ctx, { appSlot }) =>
    ctx.withDefault(
      z.object({
        enabled: z.boolean(),
        pathPrefix: z.string().default('/admin'),
        allowedRoles: ctx.withDefault(
          z.array(
            ctx.withRef({
              type: authRoleEntityType,
              onDelete: 'DELETE',
            }),
          ),
          [],
        ),
        sections: ctx.withDefault(
          z.array(createWebAdminSectionSchema(ctx, { appSlot })),
          [],
        ),
      }),
      { enabled: false, pathPrefix: '/admin' },
    ),
);
