import { z } from 'zod';

export const /* TPL_SCHEMA_NAME:START */ todoListEditFormSchema /* TPL_SCHEMA_NAME:END */ =
    z.object(
      /* TPL_SCHEMA_OBJECT:START */ {
        coverPhoto: z
          .object({ id: z.string(), name: z.string().nullish() })
          .nullish(),
        createdAt: z.string(),
        name: z.string().min(1),
        ownerId: z.uuid(),
        position: z.int(),
        status: z.enum(['ACTIVE', 'INACTIVE']).nullish(),
      } /* TPL_SCHEMA_OBJECT:END */,
    );

export type /* TPL_FORM_DATA_NAME:START */ TodoListFormData /* TPL_FORM_DATA_NAME:END */ =
  z.infer<
    typeof /* TPL_SCHEMA_NAME:START */ todoListEditFormSchema /* TPL_SCHEMA_NAME:END */
  >;
