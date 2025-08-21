import { builder } from '@src/plugins/graphql/builder.js';

export const todoItemAttachmentTagObjectType = builder.prismaObject(
  'TodoItemAttachmentTag',
  {
    fields: (t) => ({
      todoItemAttachmentId: t.expose('todoItemAttachmentId', { type: 'Uuid' }),
      tag: t.exposeString('tag'),
      todoItemAttachment: t.relation('todoItemAttachment'),
    }),
  },
);
