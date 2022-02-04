import * as yup from 'yup';

const configSchema = yup.object(CONFIG_OBJECT);

export const config = configSchema.validateSync(process.env, {
  stripUnknown: true,
});

ADDITIONAL_VERIFICATIONS;
