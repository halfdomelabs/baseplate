// @ts-nocheck

import { builder } from '%pothosImports';

import { createPresignedDownloadUrl } from '../services/create-presigned-download-url.js';
import { createPresignedUploadUrl } from '../services/create-presigned-upload-url.js';

export const presignedUrlFieldObjectType = builder.simpleObject(
  'PresignedUrlField',
  {
    fields: (t) => ({
      name: t.string(),
      value: t.string(),
    }),
  },
);

builder.mutationField('createPresignedUploadUrl', (t) =>
  t.fieldWithInputPayload({
    authorize: 'user',
    input: {
      category: t.input.string({ required: true }),
      contentType: t.input.string({ required: true }),
      fileName: t.input.string({ required: true }),
      fileSize: t.input.int({ required: true }),
    },
    payload: {
      url: t.payload.string(),
      method: t.payload.string(),
      fields: t.payload.field({
        type: [presignedUrlFieldObjectType],
        nullable: true,
      }),
      file: t.payload.field({
        type: TPL_FILE_OBJECT_TYPE,
      }),
    },
    resolve: (root, args, context) =>
      createPresignedUploadUrl(args.input, context),
  }),
);

builder.mutationField('createPresignedDownloadUrl', (t) =>
  t.fieldWithInputPayload({
    authorize: 'user',
    input: {
      fileId: t.input.field({ required: true, type: 'Uuid' }),
    },
    payload: {
      url: t.payload.string(),
    },
    resolve: (root, args, context) =>
      createPresignedDownloadUrl(args.input, context),
  }),
);
