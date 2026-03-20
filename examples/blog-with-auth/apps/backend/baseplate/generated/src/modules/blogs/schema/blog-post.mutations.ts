import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';

import {
  blogPostCreateSchema,
  blogPostUpdateSchema,
  createBlogPost,
  deleteBlogPost,
  updateBlogPost,
} from '../services/blog-post.data-service.js';
import { blogPostObjectType } from './blog-post.object-type.js';

const createBlogPostDataInputType = builder
  .inputType('CreateBlogPostData', {
    fields: (t) => ({
      blogId: t.field({ required: true, type: 'Uuid' }),
      publisherId: t.field({ required: true, type: 'Uuid' }),
      title: t.string({ required: true }),
      content: t.string({ required: true }),
      metadata: t.field({ type: 'JSON' }),
    }),
  })
  .validate(blogPostCreateSchema);

builder.mutationField('createBlogPost', (t) =>
  t.fieldWithInputPayload({
    input: {
      data: t.input.field({
        required: true,
        type: createBlogPostDataInputType,
      }),
    },
    payload: { blogPost: t.payload.field({ type: blogPostObjectType }) },
    authorize: ['admin'],
    resolve: async (root, { input: { data } }, context, info) => {
      const blogPost = await createBlogPost({
        data,
        context,
        query: queryFromInfo({ context, info, path: ['blogPost'] }),
      });
      return { blogPost };
    },
  }),
);

const updateBlogPostDataInputType = builder
  .inputType('UpdateBlogPostData', {
    fields: (t) => ({
      blogId: t.field({ type: 'Uuid' }),
      publisherId: t.field({ type: 'Uuid' }),
      title: t.string(),
      content: t.string(),
      metadata: t.field({ type: 'JSON' }),
    }),
  })
  .validate(blogPostUpdateSchema);

builder.mutationField('updateBlogPost', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({ required: true, type: 'Uuid' }),
      data: t.input.field({
        required: true,
        type: updateBlogPostDataInputType,
      }),
    },
    payload: { blogPost: t.payload.field({ type: blogPostObjectType }) },
    authorize: ['admin'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const blogPost = await updateBlogPost({
        where: { id },
        data,
        context,
        query: queryFromInfo({ context, info, path: ['blogPost'] }),
      });
      return { blogPost };
    },
  }),
);

builder.mutationField('deleteBlogPost', (t) =>
  t.fieldWithInputPayload({
    input: { id: t.input.field({ required: true, type: 'Uuid' }) },
    payload: { blogPost: t.payload.field({ type: blogPostObjectType }) },
    authorize: ['admin'],
    resolve: async (root, { input: { id } }, context, info) => {
      const blogPost = await deleteBlogPost({
        where: { id },
        context,
        query: queryFromInfo({ context, info, path: ['blogPost'] }),
      });
      return { blogPost };
    },
  }),
);
