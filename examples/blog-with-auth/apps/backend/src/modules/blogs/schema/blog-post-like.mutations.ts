import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';
import { prisma } from '@src/services/prisma.js';

import {
  likeBlogPost,
  unlikeBlogPost,
} from '../services/blog-post-like.service.js';
import { blogPostObjectType } from './blog-post.object-type.js';

/**
 * Like and unlike are separate mutations rather than one toggle: a toggle makes
 * a retried request undo itself, and both of these are idempotent.
 */
builder.mutationField('likeBlogPost', (t) =>
  t.fieldWithInputPayload({
    input: { postId: t.input.field({ required: true, type: 'Uuid' }) },
    payload: { blogPost: t.payload.field({ type: blogPostObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { postId } }, context, info) => {
      await likeBlogPost(postId, context);
      const blogPost = await prisma.blogPost.findUniqueOrThrow({
        ...queryFromInfo({ context, info, path: ['blogPost'] }),
        where: { id: postId },
      });
      return { blogPost };
    },
  }),
);

builder.mutationField('unlikeBlogPost', (t) =>
  t.fieldWithInputPayload({
    input: { postId: t.input.field({ required: true, type: 'Uuid' }) },
    payload: { blogPost: t.payload.field({ type: blogPostObjectType }) },
    authorize: ['user'],
    resolve: async (root, { input: { postId } }, context, info) => {
      await unlikeBlogPost(postId, context);
      const blogPost = await prisma.blogPost.findUniqueOrThrow({
        ...queryFromInfo({ context, info, path: ['blogPost'] }),
        where: { id: postId },
      });
      return { blogPost };
    },
  }),
);
