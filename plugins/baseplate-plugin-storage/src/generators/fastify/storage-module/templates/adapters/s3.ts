// @ts-nocheck

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

import {
  AdapterPresignedUploadUrlInput,
  AdapterPresignedUploadUrlPayload,
  StorageAdapter,
} from './types.js';

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
    input: AdapterPresignedUploadUrlInput,
  ): Promise<AdapterPresignedUploadUrlPayload> {
    const { path, contentType, minFileSize, maxFileSize } = input;

    const { url, fields } = await createPresignedPost(client, {
      Bucket: bucket,
      Key: path,
      Conditions: [
        ['content-length-range', minFileSize ?? 0, maxFileSize],
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

  async function deleteFiles(paths: string[]): Promise<void> {
    if (paths.length > 1000) {
      throw new Error('Cannot delete more than 1000 files at once');
    }
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: paths.map((Key) => ({ Key })),
      },
    });

    const response = await client.send(command);

    // for now, if we encounter a single error, throw the entire operation
    // TODO: handle partial failures
    if (response.Errors?.length) {
      const error = response.Errors[0];
      throw new Error(
        `Unable to delete key: ${error.Key ?? ''}, ${error.Message ?? ''}`,
      );
    }
  }

  async function uploadFile(
    path: string,
    contents: Buffer | ReadableStream | string,
  ): Promise<void> {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: contents,
        ServerSideEncryption: 'AES256',
      }),
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
    deleteFiles,
    uploadFile,
    downloadFile,
  };
};
