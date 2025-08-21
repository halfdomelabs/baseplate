import type { ReactElement } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import type { EmbeddedObjectFormProps } from '@src/components/admin/embedded-object-input';

import { Button } from '@src/components/ui/button';
import { InputFieldController } from '@src/components/ui/input-field';
import { logAndFormatError } from '@src/services/error-formatter';

import type { EmbeddedCustomerFormData } from '../-schemas/user-schema';

import { embeddedCustomerFormSchema } from '../-schemas/user-schema';

/* TPL_TABLE_COMPONENT:BLOCK */

export function /* TPL_COMPONENT_NAME:START */ EmbeddedCustomerForm /* TPL_COMPONENT_NAME:END */(
  /* TPL_DESTRUCTURED_PROPS:START */ {
    initialData,
    onSubmit,
  } /* TPL_DESTRUCTURED_PROPS:END */ : /* TPL_PROPS:START */ EmbeddedObjectFormProps<EmbeddedCustomerFormData> /* TPL_PROPS:END */,
): ReactElement {
  const { handleSubmit, control } =
    useForm</* TPL_EMBEDDED_FORM_DATA_TYPE:START */ EmbeddedCustomerFormData /* TPL_EMBEDDED_FORM_DATA_TYPE:END */>(
      {
        resolver: zodResolver(
          /* TPL_EMBEDDED_FORM_DATA_SCHEMA:START */ embeddedCustomerFormSchema /* TPL_EMBEDDED_FORM_DATA_SCHEMA:END */,
        ),
        defaultValues: initialData,
      },
    );

  /* TPL_HEADER:BLOCK */

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        handleSubmit(onSubmit)(e).catch((err: unknown) => {
          toast.error(logAndFormatError(err));
        });
      }}
      className="space-y-4"
    >
      {/* TPL_INPUTS:START */}
      <InputFieldController
        label="Stripe Customer ID"
        control={control}
        name="stripeCustomerId"
      />
      {/* TPL_INPUTS:END */}
      <Button type="submit">Update</Button>
    </form>
  );
}
