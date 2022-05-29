// @ts-nocheck

import { inputObjectType } from 'nexus';

export const fileUploadInput = inputObjectType({
  name: 'FileUploadInput',
  definition(t) {
    t.nonNull.uuid('id');
    t.string('name', { description: 'Discarded but useful for forms' });
  },
});
