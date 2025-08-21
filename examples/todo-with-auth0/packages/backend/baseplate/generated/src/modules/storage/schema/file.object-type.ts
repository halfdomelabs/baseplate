import { builder } from '@src/plugins/graphql/builder.js';

export const fileObjectType = builder.prismaObject('File', {
  fields: (t) => ({
    id: t.exposeID('id'),
    filename: t.exposeString('filename'),
    mimeType: t.exposeString('mimeType'),
    category: t.exposeString('category'),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    uploader: t.relation('uploader', { nullable: true }),
  }),
});
