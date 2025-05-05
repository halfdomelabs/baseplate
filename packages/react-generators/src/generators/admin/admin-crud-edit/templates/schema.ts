// @ts-nocheck

import { z } from 'zod';

export const TPL_SCHEMA_NAME = z.object(TPL_SCHEMA_OBJECT);

export type TPL_FORM_DATA_NAME = z.infer<typeof TPL_SCHEMA_NAME>;
