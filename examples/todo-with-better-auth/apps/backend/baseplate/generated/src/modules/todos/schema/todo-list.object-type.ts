import { builder } from '@src/plugins/graphql/builder.js';
import {
  dateTimeFilter,
  intFilter,
  stringFilter,
  uuidFilter,
} from '@src/plugins/graphql/filters.js';

import { todoListStatusEnum, todoListStatusFilter } from './enums.js';

export const todoListObjectType = builder.prismaObject('TodoList', {
  fields: (t) => ({
    id: t.exposeID('id'),
    ownerId: t.expose('ownerId', { type: 'Uuid' }),
    position: t.exposeInt('position'),
    name: t.exposeString('name'),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    status: t.expose('status', { nullable: true, type: todoListStatusEnum }),
    coverPhoto: t.relation('coverPhoto', { nullable: true }),
    owner: t.relation('owner'),
  }),
});

export const todoListWhereInputType = builder.inputRef('TodoListWhereInput');

todoListWhereInputType.implement({
  fields: (t) => ({
    id: t.field({ type: uuidFilter }),
    ownerId: t.field({ type: uuidFilter }),
    position: t.field({ type: intFilter }),
    name: t.field({ type: stringFilter }),
    updatedAt: t.field({ type: dateTimeFilter }),
    createdAt: t.field({ type: dateTimeFilter }),
    status: t.field({ type: todoListStatusFilter }),
    AND: t.field({ type: [todoListWhereInputType] }),
    OR: t.field({ type: [todoListWhereInputType] }),
    NOT: t.field({ type: todoListWhereInputType }),
  }),
});
