// @ts-nocheck

import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import {
  AdapterPresignedUploadUrlInput,
  AdapterPresignedUploadUrlPayload,
  StorageAdapter,
} from './types';

interface S3AdapterOptions {
  region?: string;
  bucket: string;
}

const PRESIGNED_S3_EXPIRATION = 600;

export const createS3Adapter = (options: S3AdapterOptions): StorageAdapter => {
  const { region, bucket } = options;

  const client = new S3Client({ region });

  async function createPresignedUploadUrl(
    input: AdapterPresignedUploadUrlInput
  ): Promise<AdapterPresignedUploadUrlPayload> {
    const { path, contentType, minFileSize, maxFileSize } = input;

    const { url, fields } = await createPresignedPost(client, {
      Bucket: bucket,
      Key: path,
      Conditions: [
        ['content-length-range', minFileSize || 0, maxFileSize],
        { bucket },
        { key: path },
        ...(contentType ? [{ 'Content-Type': contentType }] : []),
      ],
      Expires: PRESIGNED_S3_EXPIRATION,
    });

    return {
      method: 'POST',
      url,
      fields: Object.entries(fields).map(([name, value]) => ({ name, value })),
    };
  }

  return {
    createPresignedUploadUrl,
  };
};
