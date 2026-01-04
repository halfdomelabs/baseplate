import { z } from 'zod';

/* TPL_FORM_DATA_NAME=UserFormData */
/* TPL_SCHEMA_NAME=userEditFormSchema */

export const userEditFormSchema = z.object(
  /* TPL_SCHEMA_OBJECT:START */ {
    email: z.string().nullish(),
    name: z.string().nullish(),
  } /* TPL_SCHEMA_OBJECT:END */,
);

export type UserFormData = z.infer<typeof userEditFormSchema>;
