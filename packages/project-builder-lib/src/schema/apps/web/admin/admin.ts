import { z } from 'zod';

import type { def } from '#src/schema/index.js';

import { authRoleEntityType } from '#src/schema/auth/index.js';
import { definitionSchema } from '#src/schema/creator/schema-creator.js';

import { createAdminCrudSectionSchema } from './sections/crud.js';
import { adminSectionEntityType } from './sections/types.js';

export const createWebAdminSectionSchema = definitionSchema((ctx) =>
  ctx.withRefBuilder(createAdminCrudSectionSchema(ctx), (builder) => {
    builder.addEntity({
      type: adminSectionEntityType,
      parentPath: { context: 'app' },
      addContext: 'admin-section',
    });
  }),
);

export type WebAdminSectionConfig = def.InferOutput<
  typeof createWebAdminSectionSchema
>;

export type WebAdminSectionConfigInput = def.InferInput<
  typeof createWebAdminSectionSchema
>;

export const createAdminAppSchema = definitionSchema((ctx) =>
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
      sections: ctx.withDefault(z.array(createWebAdminSectionSchema(ctx)), []),
    }),
    { enabled: false, pathPrefix: '/admin' },
  ),
);
