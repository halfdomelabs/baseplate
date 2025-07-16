// @ts-nocheck

import { fileCategoryEnumType } from '$schemaFileCategory';
import { createPresignedDownloadUrl } from '$servicesCreatePresignedDownloadUrl';
import { createPresignedUploadUrl } from '$servicesCreatePresignedUploadUrl';
import { builder } from '%pothosImports';

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
      category: t.input.field({ type: fileCategoryEnumType, required: true }),
      contentType: t.input.string({ required: true }),
      filename: t.input.string({ required: true }),
      size: t.input.int({ required: true }),
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
