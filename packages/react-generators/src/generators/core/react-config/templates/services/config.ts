// @ts-nocheck

import * as yup from 'yup';

const configSchema = yup.object(CONFIG_SCHEMA);

export const config = configSchema.validateSync(process.env, {
  stripUnknown: true,
});
