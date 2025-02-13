import {
  baseTransformerFields,
  createDefinitionEntityNameResolver,
  modelLocalRelationEntityType,
  modelTransformerEntityType,
  zEnt,
  zRef,
} from '@halfdomelabs/project-builder-lib';
import { z } from 'zod';

export const fileTransformerSchema = zEnt(
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
);

export type FileTransformerConfig = z.infer<typeof fileTransformerSchema>;
