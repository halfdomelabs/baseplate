import { z } from 'zod';

/* HOISTED:embeddedCustomerFormSchema:START */

export const embeddedCustomerFormSchema = z.object({
  stripeCustomerId: z.string(),
});

export type EmbeddedCustomerFormData = z.infer<
  typeof embeddedCustomerFormSchema
>;

/* HOISTED:embeddedCustomerFormSchema:END */

/* TPL_FORM_DATA_NAME=UserFormData */
/* TPL_SCHEMA_NAME=userEditFormSchema */

export const userEditFormSchema = z.object(
  /* TPL_SCHEMA_OBJECT:START */ {
    customer: embeddedCustomerFormSchema.nullish(),
    email: z.email().min(1),
    name: z.string().nullish(),
  } /* TPL_SCHEMA_OBJECT:END */,
);

export type UserFormData = z.infer<typeof userEditFormSchema>;
