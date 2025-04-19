// @ts-nocheck

import { z } from 'zod';

const configSchema = z.object(TPL_CONFIG_SCHEMA);

export const config = configSchema.parse(import.meta.env);
