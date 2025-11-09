import { z } from 'zod';

import {
  createParentModelConfig,
  nestedOneToManyField,
  scalarField,
} from '@src/utils/data-operations/field-definitions.js';

const parentModel = createParentModelConfig('todoItemAttachment', (value) => ({
  id: value.id,
}));

export const todoItemAttachmentInputFields = {
  id: scalarField(z.string().uuid().optional()),
  position: scalarField(z.number().int()),
  url: scalarField(z.string()),
  tags: nestedOneToManyField({
    buildData: (data) => data,
    fields: { tag: scalarField(z.string()) },
    getWhereUnique: (input, parentModel) => ({
      todoItemAttachmentId_tag: {
        tag: input.tag,
        todoItemAttachmentId: parentModel.id,
      },
    }),
    model: 'todoItemAttachmentTag',
    parentModel,
    relationName: 'todoItemAttachment',
  }),
};
