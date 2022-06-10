import { z } from 'zod';

const configSchema = z.object({});

export const config = configSchema.parse(process.env);
