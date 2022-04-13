import * as yup from 'yup';

const configSchema = yup.object({});

export const config = configSchema.validateSync(process.env, {
  stripUnknown: true,
});
