import { z } from 'zod';

import { scalarField } from '@src/utils/data-operations/field-definitions.js';

import { fileField } from '../../../storage/services/file-field.js';
import { userImageFileFileCategory } from '../constants/file-categories.js';

export const userImageInputFields = {
  id: scalarField(z.string().uuid()),
  caption: scalarField(z.string()),
  file: fileField({
    category: userImageFileFileCategory,
    fileIdFieldName: 'fileId',
  }),
};
