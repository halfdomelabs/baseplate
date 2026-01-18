import { z } from 'zod';

import {
  defineCreateOperation,
  defineDeleteOperation,
  defineUpdateOperation,
} from '@src/utils/data-operations/define-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';

export const userInputFields = {
  email: scalarField(z.string().nullish()),
  name: scalarField(z.string().nullish()),
  emailVerified: scalarField(z.boolean().optional()),
};

export const createUser = defineCreateOperation({
  model: 'user',
  fields: userInputFields,
  getWhereUnique: (result) => ({ id: result.id }),
  create: async ({ tx, data, query }) => {
    const item = await tx.user.create({
      data,
      ...query,
    });
    return item;
  },
});

export const updateUser = defineUpdateOperation({
  model: 'user',
  fields: userInputFields,
  update: async ({ tx, where, data, query }) => {
    const item = await tx.user.update({
      where,
      data,
      ...query,
    });
    return item;
  },
});

export const deleteUser = defineDeleteOperation({
  model: 'user',
  delete: async ({ tx, where, query }) => {
    const item = await tx.user.delete({
      where,
      ...query,
    });
    return item;
  },
});
