import { z } from 'zod';

import { scalarField } from '@src/utils/data-operations/field-definitions.js';

export const userProfileInputFields = {
  id: scalarField(z.string().uuid()),
  bio: scalarField(z.string().nullish()),
  birthDay: scalarField(z.date().nullish()),
};
