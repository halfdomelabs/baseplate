import type { def } from '@baseplate-dev/project-builder-lib';

import {
  baseTransformerFields,
  createDefinitionEntityNameResolver,
  definitionSchemaWithSlots,
  modelEntityType,
  modelLocalRelationEntityType,
  modelTransformerEntityType,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { fileCategoryEntityType } from '#src/storage/core/schema/plugin-definition.js';

export const createFileTransformerSchema = definitionSchemaWithSlots(
  { modelSlot: modelEntityType },
  (ctx, { modelSlot }) =>
    ctx.withEnt(
      z.object({
        ...baseTransformerFields,
        fileRelationRef: ctx.withRef({
          type: modelLocalRelationEntityType,
          onDelete: 'DELETE_PARENT',
          parentSlot: modelSlot,
        }),
        categoryRef: ctx.withRef({
          type: fileCategoryEntityType,
          onDelete: 'RESTRICT',
        }),
        type: z.literal('file'),
      }),
      {
        type: modelTransformerEntityType,
        parentSlot: modelSlot,
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
