import { builder } from '@src/plugins/graphql/builder.js';

export const userImageObjectType = builder.prismaObject('UserImage', {
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.expose('userId', { type: 'Uuid' }),
    fileId: t.expose('fileId', { type: 'Uuid' }),
    file: t.relation('file'),
  }),
});
