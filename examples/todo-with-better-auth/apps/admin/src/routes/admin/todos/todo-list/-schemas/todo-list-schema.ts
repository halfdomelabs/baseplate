import { z } from 'zod';

/* TPL_FORM_DATA_NAME=TodoListFormData */
/* TPL_SCHEMA_NAME=todoListEditFormSchema */

export const todoListEditFormSchema = z.object(
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

export type TodoListFormData = z.infer<typeof todoListEditFormSchema>;
