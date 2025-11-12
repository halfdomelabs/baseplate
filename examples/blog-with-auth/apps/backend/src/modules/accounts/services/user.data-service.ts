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
  buildData: (data) => data,
});

export const updateUser = defineUpdateOperation({
  model: 'user',
  fields: userInputFields,
  buildData: (data) => data,
});

export const deleteUser = defineDeleteOperation({
  model: 'user',
});
