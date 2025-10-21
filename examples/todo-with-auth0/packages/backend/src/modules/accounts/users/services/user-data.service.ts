import z from 'zod';

import { fileField } from '@src/modules/storage/services/file-field.js';
import {
  defineCreateOperation,
  defineDeleteOperation,
  defineUpdateOperation,
} from '@src/utils/data-operations/define-operations.js';
import {
  nestedOneToManyField,
  nestedOneToOneField,
  scalarField,
} from '@src/utils/data-operations/field-definitions.js';

import {
  userImageFileFileCategory,
  userProfileAvatarFileCategory,
} from '../constants/file-categories.js';

const userFields = {
  name: scalarField(z.string().min(1)),
  email: scalarField(z.string().email()),
  customer: nestedOneToOneField({
    parentModel: 'user',
    model: 'customer',
    fields: {
      stripeCustomerId: scalarField(z.string().min(1)),
    },
    getWhereUniqueFromParent: (parentModel) => ({
      id: parentModel.id,
    }),
    buildData: ({ create, update }, parentModel) => ({
      create: {
        ...create,
        user: { connect: { id: parentModel.id } },
      },
      update: { ...update },
    }),
  }),
  userProfile: nestedOneToOneField({
    parentModel: 'user',
    model: 'userProfile',
    fields: {
      bio: scalarField(z.string().min(1)),
      birthDay: scalarField(z.string().nullish()),
      avatar: fileField({
        category: userProfileAvatarFileCategory,
        fileIdFieldName: 'avatarId',
      }),
    },
    getWhereUniqueFromParent: (parentModel) => ({
      userId: parentModel.id,
    }),
    buildData: ({ create, update }, result) => ({
      create: {
        ...create,
        user: { connect: { id: result.id } },
      },
      update,
    }),
  }),
  images: nestedOneToManyField({
    parentModel: 'user',
    model: 'userImage',
    fields: {
      id: scalarField(z.string()),
      caption: scalarField(z.string().min(1)),
      file: fileField({
        category: userImageFileFileCategory,
        fileIdFieldName: 'fileId',
      }),
    },
    getWhereFromParentModel: (parentModel) => ({
      userId: parentModel.id,
    }),
    getWhereUnique: (input) => ({
      id: input.id,
    }),
    buildData: ({ create, update }, result) => ({
      create: {
        ...create,
        user: { connect: { id: result.id } },
      },
      update,
    }),
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
