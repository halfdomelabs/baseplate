// @ts-nocheck

import { z } from 'zod';

export const SCHEMA_NAME = z.object(SCHEMA_OBJECT);

export type FORM_DATA_NAME = z.infer<typeof SCHEMA_NAME>;
