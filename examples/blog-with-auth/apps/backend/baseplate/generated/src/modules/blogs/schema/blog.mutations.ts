import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';

import {
  blogUpdateSchema,
  deleteBlog,
  updateBlog,
} from '../services/blog.data-service.js';
import { blogObjectType } from './blog.object-type.js';

const updateBlogDataInputType = builder
  .inputType('UpdateBlogData', {
    fields: (t) => ({ name: t.string(), userId: t.field({ type: 'Uuid' }) }),
  })
  .validate(blogUpdateSchema);

builder.mutationField('updateBlog', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({ required: true, type: 'Uuid' }),
      data: t.input.field({ required: true, type: updateBlogDataInputType }),
    },
    payload: { blog: t.payload.field({ type: blogObjectType }) },
    authorize: ['public', 'user', 'system', 'admin'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const blog = await updateBlog({
        where: { id },
        data,
        context,
        query: queryFromInfo({ context, info, path: ['blog'] }),
      });
      return { blog };
    },
  }),
);

builder.mutationField('deleteBlog', (t) =>
  t.fieldWithInputPayload({
    input: { id: t.input.field({ required: true, type: 'Uuid' }) },
    payload: { blog: t.payload.field({ type: blogObjectType }) },
    authorize: ['public', 'user', 'system', 'admin'],
    resolve: async (root, { input: { id } }, context, info) => {
      const blog = await deleteBlog({
        where: { id },
        context,
        query: queryFromInfo({ context, info, path: ['blog'] }),
      });
      return { blog };
    },
  }),
);
