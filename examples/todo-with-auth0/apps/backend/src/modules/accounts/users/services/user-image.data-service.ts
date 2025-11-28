import { z } from 'zod';

import { defineDeleteOperation } from '@src/utils/data-operations/define-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';

import { fileField } from '../../../storage/services/file-field.js';
import { userImageFileFileCategory } from '../constants/file-categories.js';

export const userImageInputFields = {
  id: scalarField(z.uuid().optional()),
  caption: scalarField(z.string()),
  file: fileField({
    category: userImageFileFileCategory,
    fileIdFieldName: 'fileId',
  }),
};

export const deleteUserImage = defineDeleteOperation({
  model: 'userImage',
  delete: ({ tx, where, query }) =>
    tx.userImage.delete({
      where,
      ...query,
    }),
});
