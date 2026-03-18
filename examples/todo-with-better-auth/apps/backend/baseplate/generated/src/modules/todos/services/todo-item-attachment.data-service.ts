import { omit } from 'es-toolkit';
import { z } from 'zod';

import { oneToManyTransformer } from '@src/utils/data-operations/nested-transformers.js';

export const todoItemAttachmentFieldSchemas = {
  id: z.uuid().optional(),
  position: z.int(),
  url: z.string(),
  tags: z.array(z.object({ tag: z.string() })).optional(),
};

export const todoItemAttachmentTransformers = {
  tags: oneToManyTransformer({
    compareItem: (input, existing) => input.tag === existing.tag,
    deleteRemoved: async (tx, removedItems) => {
      await tx.todoItemAttachmentTag.deleteMany({
        where: {
          OR: removedItems.map((i) => ({
            todoItemAttachmentId: i.todoItemAttachmentId,
            tag: i.tag,
          })),
        },
      });
    },
    model: 'todoItemAttachmentTag',
    parentModel: 'todoItemAttachment',
    processCreate: (itemInput) => async (tx, parent) => {
      await tx.todoItemAttachmentTag.create({
        data: {
          ...itemInput,
          todoItemAttachment: { connect: { id: parent.id } },
        },
      });
    },
    processUpdate: (itemInput, existingItem) => async (tx) => {
      await tx.todoItemAttachmentTag.update({
        where: {
          todoItemAttachmentId_tag: {
            todoItemAttachmentId: existingItem.todoItemAttachmentId,
            tag: existingItem.tag,
          },
        },
        data: omit(itemInput, ['tag']),
      });
    },
    schema: z.object({ tag: z.string() }),
  }),
};
