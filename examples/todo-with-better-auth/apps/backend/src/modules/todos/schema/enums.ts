import { builder } from '@src/plugins/graphql/builder.js';

export const todoListStatusEnum = builder.enumType('TodoListStatus', {
  values: { ACTIVE: {}, INACTIVE: {} },
});
