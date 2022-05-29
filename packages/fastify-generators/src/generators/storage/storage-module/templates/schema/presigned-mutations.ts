// @ts-nocheck

import { objectType } from 'nexus';
import { createStandardMutation } from '%nexus/utils';
import { createPresignedUploadUrl } from '../services/create-presigned-upload-url';

export const presignedUrlFieldObjectType = objectType({
  name: 'presignedUrlField',
  definition(t) {
    t.nonNull.string('name');
    t.nonNull.string('value');
  },
});

export const createPresignedUploadUrlMutation = createStandardMutation({
  name: 'createPresignedUploadUrl',
  authorize: 'user',
  inputDefinition: (t) => {
    t.nonNull.string('category');
    t.nonNull.string('contentType');
    t.nonNull.string('fileName');
    t.nonNull.int('fileSize');
  },
  payloadDefinition: (t) => {
    t.nonNull.string('url');
    t.nonNull.string('method');
    t.list.nonNull.field('fields', { type: 'presignedUrlField' });
    t.nonNull.field('file', { type: 'File' });
  },
  resolve: (root, args, context) =>
    createPresignedUploadUrl(args.input, context),
});
