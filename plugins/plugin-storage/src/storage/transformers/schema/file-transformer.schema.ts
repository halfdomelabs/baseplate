import type { def } from '@baseplate-dev/project-builder-lib';

import {
  authRoleEntityType,
  baseTransformerFields,
  createDefinitionEntityNameResolver,
  definitionSchema,
  modelLocalRelationEntityType,
  modelTransformerEntityType,
} from '@baseplate-dev/project-builder-lib';
import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

import { storageAdapterEntityType } from '#src/storage/core/schema/plugin-definition.js';

export const createFileTransformerSchema = definitionSchema((ctx) =>
  ctx.withEnt(
    z.object({
      ...baseTransformerFields,
      fileRelationRef: ctx.withRef({
        type: modelLocalRelationEntityType,
        onDelete: 'DELETE_PARENT',
        parentPath: { context: 'model' },
      }),
      category: z.object({
        name: CASE_VALIDATORS.CONSTANT_CASE,
        maxFileSizeMb: z.number().int().positive(),
        authorize: z.object({
          uploadRoles: z.array(
            ctx.withRef({
              type: authRoleEntityType,
              onDelete: 'RESTRICT',
            }),
          ),
        }),
        adapterRef: ctx.withRef({
          type: storageAdapterEntityType,
          onDelete: 'RESTRICT',
        }),
      }),
      type: z.literal('file'),
    }),
    {
      type: modelTransformerEntityType,
      parentPath: { context: 'model' },
      getNameResolver: (entity) =>
        createDefinitionEntityNameResolver({
          idsToResolve: { fileRelation: entity.fileRelationRef },
          resolveName: (entityNames) => entityNames.fileRelation,
        }),
    },
  ),
);

export type FileTransformerDefinition = def.InferInput<
  typeof createFileTransformerSchema
>;
