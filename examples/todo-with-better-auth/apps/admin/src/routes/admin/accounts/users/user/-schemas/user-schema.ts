import { z } from 'zod';

/* HOISTED:embeddedCustomerFormSchema:START */

export const embeddedCustomerFormSchema = z.object({
  stripeCustomerId: z.string(),
});

export type EmbeddedCustomerFormData = z.infer<
  typeof embeddedCustomerFormSchema
>;

/* HOISTED:embeddedCustomerFormSchema:END */

/* HOISTED:embeddedRolesFormSchema:START */

export const embeddedRolesFormSchema = z.object({ role: z.string() });

export type EmbeddedRolesFormData = z.infer<typeof embeddedRolesFormSchema>;

/* HOISTED:embeddedRolesFormSchema:END */

/* TPL_FORM_DATA_NAME=UserFormData */
/* TPL_SCHEMA_NAME=userEditFormSchema */

export const userEditFormSchema = z.object(
  /* TPL_SCHEMA_OBJECT:START */ {
    customer: embeddedCustomerFormSchema.nullish(),
    email: z.email().min(1),
    name: z.string().nullish(),
    password: z.string().nullish(),
    roles: z.array(embeddedRolesFormSchema).nullish(),
  } /* TPL_SCHEMA_OBJECT:END */,
);

export type UserFormData = z.infer<typeof userEditFormSchema>;
