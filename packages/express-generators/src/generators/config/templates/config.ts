import * as yup from 'yup';
import dotenv from 'dotenv';

dotenv.config();

CONFIG_HEADER;

const CONFIG_SCHEMA = yup.object(CONFIG_SCHEMA_OBJECT);

// validate config
const config = CONFIG_SCHEMA.validateSync(process.env, {
  stripUnknown: true,
});

export default config;
