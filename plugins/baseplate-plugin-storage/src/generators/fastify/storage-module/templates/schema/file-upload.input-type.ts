// @ts-nocheck

import { builder } from '%pothosImports';

export const fileUploadInputInputType = builder.inputType('FileUploadInput', {
  fields: (t) => ({
    id: t.field({ required: true, type: 'Uuid' }),
    name: t.string({ description: 'Discarded but useful for forms' }),
  }),
});
