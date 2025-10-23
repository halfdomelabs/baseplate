import { z } from 'zod';

export const /* TPL_SCHEMA_NAME:START */ userEditFormSchema /* TPL_SCHEMA_NAME:END */ =
    z.object(
      /* TPL_SCHEMA_OBJECT:START */ {
        email: z.string().nullish(),
        name: z.string().nullish(),
      } /* TPL_SCHEMA_OBJECT:END */,
    );

export type /* TPL_FORM_DATA_NAME:START */ UserFormData /* TPL_FORM_DATA_NAME:END */ =
  z.infer<
    typeof /* TPL_SCHEMA_NAME:START */ userEditFormSchema /* TPL_SCHEMA_NAME:END */
  >;
