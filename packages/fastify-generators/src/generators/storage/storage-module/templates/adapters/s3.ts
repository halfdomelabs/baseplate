// @ts-nocheck

import { Readable } from 'stream';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

  async function createPresignedDownloadUrl(path: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    return getSignedUrl(client, command, {
      expiresIn: PRESIGNED_S3_EXPIRATION_SECONDS,
    });
  }

  function getHostedUrl(path: string): string | null {
    if (!hostedUrl) {
      return null;
    }
    return `${hostedUrl.replace(/\/$/, '')}/${path}`;
  }

  async function uploadFile(
    path: string,
    contents: Buffer | ReadableStream | string
  ): Promise<void> {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: contents,
        ServerSideEncryption: 'AES256',
      })
    );
  }

  async function downloadFile(path: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    const response = await client.send(command);

    return response.Body as Readable;
  }

  return {
    createPresignedUploadUrl,
    createPresignedDownloadUrl,
    getHostedUrl,
    uploadFile,
    downloadFile,
  };
};
