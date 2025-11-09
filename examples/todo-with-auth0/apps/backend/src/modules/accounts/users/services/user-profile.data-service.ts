import { z } from 'zod';

import { defineDeleteOperation } from '@src/utils/data-operations/define-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';

import { fileField } from '../../../storage/services/file-field.js';
import { userProfileAvatarFileCategory } from '../constants/file-categories.js';

export const userProfileInputFields = {
  id: scalarField(z.string().uuid()),
  bio: scalarField(z.string().nullish()),
  birthDay: scalarField(z.date().nullish()),
  avatar: fileField({
    category: userProfileAvatarFileCategory,
    fileIdFieldName: 'avatarId',
    optional: true,
  }),
};

export const deleteUserProfile = defineDeleteOperation({
  model: 'userProfile',
});
