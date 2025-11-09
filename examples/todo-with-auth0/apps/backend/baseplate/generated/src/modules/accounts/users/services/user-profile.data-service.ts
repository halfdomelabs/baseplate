import { z } from 'zod';

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
