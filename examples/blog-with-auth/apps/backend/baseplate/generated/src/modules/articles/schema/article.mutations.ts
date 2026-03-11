import { queryFromInfo } from '@pothos/plugin-prisma';

import { builder } from '@src/plugins/graphql/builder.js';

import {
  articleCreateSchema,
  articleUpdateSchema,
  createArticle,
  updateArticle,
} from '../services/article.data-service.js';
import { articleObjectType } from './article.object-type.js';

const createArticleDataInputType = builder
  .inputType('CreateArticleData', {
    fields: (t) => ({
      title: t.string({ required: true }),
      content: t.string({ required: true }),
    }),
  })
  .validate(articleCreateSchema);

builder.mutationField('createArticle', (t) =>
  t.fieldWithInputPayload({
    input: {
      data: t.input.field({ required: true, type: createArticleDataInputType }),
    },
    payload: { article: t.payload.field({ type: articleObjectType }) },
    authorize: ['admin'],
    resolve: async (root, { input: { data } }, context, info) => {
      const article = await createArticle({
        data,
        context,
        query: queryFromInfo({ context, info, path: ['article'] }),
      });
      return { article };
    },
  }),
);

const updateArticleDataInputType = builder
  .inputType('UpdateArticleData', {
    fields: (t) => ({ title: t.string(), content: t.string() }),
  })
  .validate(articleUpdateSchema);

builder.mutationField('updateArticle', (t) =>
  t.fieldWithInputPayload({
    input: {
      id: t.input.field({ required: true, type: 'Uuid' }),
      data: t.input.field({ required: true, type: updateArticleDataInputType }),
    },
    payload: { article: t.payload.field({ type: articleObjectType }) },
    authorize: ['admin'],
    resolve: async (root, { input: { id, data } }, context, info) => {
      const article = await updateArticle({
        where: { id },
        data,
        context,
        query: queryFromInfo({ context, info, path: ['article'] }),
      });
      return { article };
    },
  }),
);
