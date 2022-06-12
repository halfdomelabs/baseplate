// @ts-nocheck

import { z } from 'zod';

const configSchema = z.object(CONFIG_SCHEMA);

export const config = configSchema.parse(process.env);
