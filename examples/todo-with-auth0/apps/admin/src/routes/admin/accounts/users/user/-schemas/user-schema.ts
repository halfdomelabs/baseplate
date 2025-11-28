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

export const /* TPL_SCHEMA_NAME:START */ userEditFormSchema /* TPL_SCHEMA_NAME:END */ =
    z.object(
      /* TPL_SCHEMA_OBJECT:START */ {
        customer: embeddedCustomerFormSchema.nullish(),
        email: z.email().min(1),
        name: z.string().nullish(),
        password: z.string().nullish(),
        roles: z.array(embeddedRolesFormSchema).nullish(),
      } /* TPL_SCHEMA_OBJECT:END */,
    );

export type /* TPL_FORM_DATA_NAME:START */ UserFormData /* TPL_FORM_DATA_NAME:END */ =
  z.infer<
    typeof /* TPL_SCHEMA_NAME:START */ userEditFormSchema /* TPL_SCHEMA_NAME:END */
  >;
