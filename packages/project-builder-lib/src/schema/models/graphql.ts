import { z } from 'zod';

import {
  modelForeignRelationEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from './types.js';
import { authRoleEntityType } from '../auth/types.js';
import { zRef } from '@src/references/ref-builder.js';

const roleArray = z
  .array(
    zRef(z.string(), {
      type: authRoleEntityType,
      onDelete: 'DELETE',
    }),
  )
  .optional();

export const modelGraphqlSchema = z.object({
  objectType: z
    .object({
      enabled: z.boolean(),
      fields: z.array(
        zRef(z.string(), {
          type: modelScalarFieldEntityType,
          onDelete: 'DELETE',
          parentPath: { context: 'model' },
        }),
      ),
      localRelations: z.array(
        zRef(z.string(), {
          type: modelLocalRelationEntityType,
          onDelete: 'DELETE',
          parentPath: { context: 'model' },
        }),
      ),
      foreignRelations: z.array(
        zRef(z.string(), {
          type: modelForeignRelationEntityType,
          onDelete: 'DELETE',
          parentPath: { context: 'model' },
        }),
      ),
    })
    .optional(),
  queries: z
    .object({
      get: z
        .object({
          enabled: z.boolean(),
          roles: roleArray,
        })
        .optional(),
      list: z
        .object({
          enabled: z.boolean(),
          roles: roleArray,
        })
        .optional(),
    })
    .optional(),
  mutations: z
    .object({
      create: z
        .object({
          enabled: z.boolean(),
          roles: roleArray,
        })
        .optional(),
      update: z
        .object({
          enabled: z.boolean(),
          roles: roleArray,
        })
        .optional(),
      delete: z
        .object({
          enabled: z.boolean(),
          roles: roleArray,
        })
        .optional(),
    })
    .optional(),
});
