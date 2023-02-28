// @ts-nocheck

import { builder } from '%pothos';

export const fileUploadInputInputType = builder.inputType('FileUploadInput', {
  fields: (t) => ({
    id: t.string({ required: true }),
    name: t.string({ description: 'Discarded but useful for forms' }),
  }),
});
