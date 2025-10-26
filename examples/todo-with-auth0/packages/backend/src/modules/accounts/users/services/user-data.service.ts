import z from 'zod';

import { fileField } from '@src/modules/storage/services/file-field.js';
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

import {
  userImageFileFileCategory,
  userProfileAvatarFileCategory,
} from '../constants/file-categories.js';

const parentModel = createParentModelConfig('user', (parentModel) => ({
  id: parentModel.id,
}));

const userFields = {
  name: scalarField(z.string().min(1)),
  email: scalarField(z.string().email()),
  customer: nestedOneToOneField({
    parentModel,
    model: 'customer',
    relationName: 'user',
    fields: {
      stripeCustomerId: scalarField(z.string().min(1)),
    },
    getWhereUnique: (parentModel) => ({
      id: parentModel.id,
    }),
    buildData: (data) => data,
  }),
  userProfile: nestedOneToOneField({
    parentModel,
    model: 'userProfile',
    relationName: 'user',
    fields: {
      bio: scalarField(z.string().min(1)),
      birthDay: scalarField(z.string().nullish()),
      avatar: fileField({
        category: userProfileAvatarFileCategory,
        fileIdFieldName: 'avatarId',
      }),
    },
    getWhereUnique: (parentModel) => ({
      userId: parentModel.id,
    }),
    buildData: (data) => data,
  }),
  images: nestedOneToManyField({
    parentModel,
    model: 'userImage',
    relationName: 'user',
    fields: {
      id: scalarField(z.string()),
      caption: scalarField(z.string().min(1)),
      file: fileField({
        category: userImageFileFileCategory,
        fileIdFieldName: 'fileId',
      }),
    },
    getWhereUnique: (input) => ({
      id: input.id,
    }),
    buildData: (data) => data,
  }),
};

export const createUser = defineCreateOperation({
  model: 'user',
  fields: userFields,
  buildData: (data) => data,
});

export const updateUser = defineUpdateOperation({
  model: 'user',
  fields: userFields,
  buildData: (data) => data,
});

export const deleteUser = defineDeleteOperation({
  model: 'user',
});
