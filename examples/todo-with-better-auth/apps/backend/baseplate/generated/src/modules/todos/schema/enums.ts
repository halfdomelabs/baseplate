import { builder } from '@src/plugins/graphql/builder.js';

export const todoListStatusEnum = builder.enumType('TodoListStatus', {
  values: { ACTIVE: {}, INACTIVE: {} },
});

export const todoListStatusFilter = builder.inputType('TodoListStatusFilter', {
  fields: (t) => ({
    equals: t.field({ type: todoListStatusEnum }),
    not: t.field({ type: todoListStatusEnum }),
    in: t.field({ type: [todoListStatusEnum] }),
    notIn: t.field({ type: [todoListStatusEnum] }),
  }),
});
