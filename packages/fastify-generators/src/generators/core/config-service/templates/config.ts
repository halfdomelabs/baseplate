// @ts-nocheck

import { z } from 'zod';

const configSchema = TPL_CONFIG_SCHEMA;

export const config = configSchema.parse(process.env);

TPL_ADDITIONAL_VERIFICATIONS;
