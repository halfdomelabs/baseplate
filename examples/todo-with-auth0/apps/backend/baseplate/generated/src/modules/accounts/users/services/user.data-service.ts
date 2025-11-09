import { pick } from 'es-toolkit';
import { z } from 'zod';

import {
  defineCreateOperation,
  defineDeleteOperation,
  defineUpdateOperation,
} from '@src/utils/data-operations/define-operations.js';
import {
  createParentModelConfig,
  nestedOneToManyField,
  nestedOneToOneField,
  scalarField,
} from '@src/utils/data-operations/field-definitions.js';

import { userImageInputFields } from './user-image.data-service.js';
import { userProfileInputFields } from './user-profile.data-service.js';

const parentModel = createParentModelConfig('user', (value) => ({
  id: value.id,
}));

export const userInputFields = {
  name: scalarField(z.string().nullish()),
  email: scalarField(z.string()),
  customer: nestedOneToOneField({
    buildData: (data) => data,
    fields: { stripeCustomerId: scalarField(z.string()) },
    getWhereUnique: (parentModel) => ({ id: parentModel.id }),
    model: 'customer',
    parentModel,
    relationName: 'user',
  }),
  images: nestedOneToManyField({
    buildData: (data) => data,
    fields: pick(userImageInputFields, ['id', 'caption', 'file']),
    getWhereUnique: (input) => ({ id: input.id }),
    model: 'userImage',
    parentModel,
    relationName: 'user',
  }),
  roles: nestedOneToManyField({
    buildData: (data) => data,
    fields: { role: scalarField(z.string()) },
    getWhereUnique: (input, parentModel) => ({
      userId_role: { role: input.role, userId: parentModel.id },
    }),
    model: 'userRole',
    parentModel,
    relationName: 'user',
  }),
  userProfile: nestedOneToOneField({
    buildData: (data) => data,
    fields: pick(userProfileInputFields, ['id', 'bio', 'birthDay', 'avatar']),
    getWhereUnique: (parentModel) => ({ userId: parentModel.id }),
    model: 'userProfile',
    parentModel,
    relationName: 'user',
  }),
};

export const createUser = defineCreateOperation({
  model: 'user',
  fields: pick(userInputFields, ['name', 'email']),
  buildData: (data) => data,
});

export const updateUser = defineUpdateOperation({
  model: 'user',
  fields: pick(userInputFields, ['name', 'email']),
  buildData: (data) => data,
});

export const deleteUser = defineDeleteOperation({
  model: 'user',
});
