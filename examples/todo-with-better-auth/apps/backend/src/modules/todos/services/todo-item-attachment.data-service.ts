import { z } from 'zod';

import { oneToManyTransformer } from '@src/utils/data-operations/nested-transformers.js';

const todoItemAttachmentTagInputSchema = z.object({
  tag: z.string(),
});

export const todoItemAttachmentInputSchema = z.object({
  id: z.uuid().optional(),
  position: z.int(),
  url: z.string(),
  tags: z.array(todoItemAttachmentTagInputSchema).optional(),
});

export const todoItemAttachmentTransformers = {
  tags: oneToManyTransformer({
    parentModel: 'todoItemAttachment',
    model: 'todoItemAttachmentTag',
    schema: todoItemAttachmentTagInputSchema,

    processCreate: (itemInput) => async (tx, parent) => {
      await tx.todoItemAttachmentTag.create({
        data: {
          tag: itemInput.tag,
          todoItemAttachment: { connect: { id: parent.id } },
        },
      });
    },

    deleteRemoved: async (removedItems, tx) => {
      await tx.todoItemAttachmentTag.deleteMany({
        where: {
          OR: removedItems.map((i) => ({
            todoItemAttachmentId: i.todoItemAttachmentId,
            tag: i.tag,
          })),
        },
      });
    },
  }),
};
