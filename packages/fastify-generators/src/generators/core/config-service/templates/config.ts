// @ts-nocheck
import { z } from 'zod';

const configSchema = z.object(CONFIG_OBJECT);

export const config = configSchema.parse(process.env);

ADDITIONAL_VERIFICATIONS;
