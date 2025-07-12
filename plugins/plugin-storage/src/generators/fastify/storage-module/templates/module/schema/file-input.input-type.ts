// @ts-nocheck

import { builder } from '%pothosImports';

export const fileInputInputType = builder.inputType('FileInput', {
  description: 'Input representing an uploaded file',
  fields: (t) => ({
    id: t.field({ required: true, type: 'Uuid' }),
    name: t.string({ description: 'Discarded but useful for forms' }),
  }),
});
