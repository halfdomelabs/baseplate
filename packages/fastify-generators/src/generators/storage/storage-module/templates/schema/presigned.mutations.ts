// @ts-nocheck

import { builder } from '%pothos';
import { createPresignedDownloadUrl } from '../services/create-presigned-download-url';
import { createPresignedUploadUrl } from '../services/create-presigned-upload-url';
import { FILE_OBJECT_TYPE } from 'FILE_OBJECT_MODULE';

export const presignedUrlFieldObjectType = builder.simpleObject(
  'PresignedUrlField',
  {
    fields: (t) => ({
      name: t.string(),
      value: t.string(),
    }),
  }
);

export const createPresignedUploadUrlMutation = builder.mutationField(
  'createPresignedUploadUrl',
  (t) =>
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
        file: t.payload.field({ type: FILE_OBJECT_TYPE }),
      },
      resolve: (root, args, context) =>
        createPresignedUploadUrl(args.input, context),
    })
);

export const createPresignedDownloadUrlMutation = builder.mutationField(
  'createPresignedDownloadUrl',
  (t) =>
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
    })
);
