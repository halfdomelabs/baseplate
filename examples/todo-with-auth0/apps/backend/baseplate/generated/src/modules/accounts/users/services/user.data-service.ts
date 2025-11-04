import { z } from 'zod';

import { defineCreateOperation } from '@src/utils/data-operations/define-operations.js';
import { scalarField } from '@src/utils/data-operations/field-definitions.js';

export const userInputFields = {
  email: scalarField(z.string()),
  name: scalarField(z.string().nullish()),
};

export const createUser = defineCreateOperation({
  model: 'user',
  fields: userInputFields,
  buildData: (data) => data,
});
