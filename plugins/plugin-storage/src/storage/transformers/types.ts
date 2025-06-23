import type { def } from '@baseplate-dev/project-builder-lib';

import {
  baseTransformerFields,
  createDefinitionEntityNameResolver,
  definitionSchema,
  modelLocalRelationEntityType,
  modelTransformerEntityType,
  zEnt,
  zRef,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const createFileTransformerSchema = definitionSchema(() =>
  zEnt(
    z.object({
      ...baseTransformerFields,
      fileRelationRef: zRef(z.string(), {
        type: modelLocalRelationEntityType,
        onDelete: 'DELETE_PARENT',
        parentPath: { context: 'model' },
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

export type FileTransformerConfig = def.InferInput<
  typeof createFileTransformerSchema
>;
