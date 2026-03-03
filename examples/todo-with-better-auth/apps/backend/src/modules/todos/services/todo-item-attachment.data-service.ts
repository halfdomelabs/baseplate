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
  id: scalarField(z.uuid().optional()),
  position: scalarField(z.int()),
  url: scalarField(z.string()),
  tags: nestedOneToManyField({
    buildCreateData: (data) => data,
    buildUpdateData: (data) => data,
    fields: { tag: scalarField(z.string()) },
    getWhereUnique: (input, parentModel) =>
      input.tag
        ? {
            todoItemAttachmentId_tag: {
              tag: input.tag,
              todoItemAttachmentId: parentModel.id,
            },
          }
        : undefined,
    model: 'todoItemAttachmentTag',
    parentModel,
    relationName: 'todoItemAttachment',
  }),
};
