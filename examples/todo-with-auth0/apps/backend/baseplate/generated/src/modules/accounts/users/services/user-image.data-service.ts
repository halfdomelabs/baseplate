import { z } from 'zod';

import { scalarField } from '@src/utils/data-operations/field-definitions.js';

export const userImageInputFields = {
  id: scalarField(z.string().uuid()),
  caption: scalarField(z.string()),
};
