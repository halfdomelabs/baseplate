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
  /**
   * Publicly hosted URL for the S3 bucket, e.g. https://uploads.example.com
   */
  hostedUrl?: string;
  bucket: string;
}

const PRESIGNED_S3_EXPIRATION_SECONDS = 600;

export const createS3Adapter = (options: S3AdapterOptions): StorageAdapter => {
  const { region, hostedUrl, bucket } = options;

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
      Expires: PRESIGNED_S3_EXPIRATION_SECONDS,
    });

    return {
      method: 'POST',
      url,
      fields: Object.entries(fields).map(([name, value]) => ({ name, value })),
    };
  }

  function getHostedUrl(path: string): string | null {
    if (!hostedUrl) {
      return null;
    }
    return `${hostedUrl.replace(/\/$/, '')}/${path}`;
  }

  return {
    createPresignedUploadUrl,
    getHostedUrl,
  };
};
