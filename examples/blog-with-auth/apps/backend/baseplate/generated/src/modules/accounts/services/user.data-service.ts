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
  create: ({ tx, data, query }) =>
    tx.user.create({
      data,
      ...query,
    }),
});

export const updateUser = defineUpdateOperation({
  model: 'user',
  fields: userInputFields,
  update: ({ tx, where, data, query }) =>
    tx.user.update({
      where,
      data,
      ...query,
    }),
});

export const deleteUser = defineDeleteOperation({
  model: 'user',
  delete: ({ tx, where, query }) =>
    tx.user.delete({
      where,
      ...query,
    }),
});
