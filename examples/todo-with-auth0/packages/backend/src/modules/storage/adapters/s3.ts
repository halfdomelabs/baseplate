import type { Readable } from 'node:stream';

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type {
  CreatePresignedUploadOptions,
  FileMetadata,
  PresignedUploadUrl,
  StorageAdapter,
  UploadFileOptions,
} from '../types/adapter.js';

/** Options for the S3 adapter. */
interface S3AdapterOptions {
  /** AWS region of the bucket. */
  region?: string;
  /** Name of the S3 bucket. */
  bucket: string;
  /** Publicly hosted URL for the S3 bucket, e.g. https://uploads.example.com */
  publicUrl?: string;
}

const PRESIGNED_S3_EXPIRATION_SECONDS = 600;

/**
 * Create a new S3 adapter.
 *
 * @param options - Options for the S3 adapter.
 * @returns A new S3 adapter.
 */
export const createS3Adapter = (options: S3AdapterOptions): StorageAdapter => {
  const { region, publicUrl, bucket } = options;

  const client = new S3Client({ region });

  async function createPresignedUploadUrl(
    options: CreatePresignedUploadOptions,
  ): Promise<PresignedUploadUrl> {
    const { path, contentType, contentLengthRange, expiresIn } = options;
    const [minFileSize, maxFileSize] = contentLengthRange ?? [
      0,
      1024 * 1024 * 100,
    ]; // Default 100MB max
    const expirationSeconds = expiresIn ?? PRESIGNED_S3_EXPIRATION_SECONDS;

    const { url, fields } = await createPresignedPost(client, {
      Bucket: bucket,
      Key: path,
      Conditions: [
        ['content-length-range', minFileSize, maxFileSize],
        { bucket },
        { key: path },
        ...(contentType ? [{ 'Content-Type': contentType }] : []),
      ],
      Fields: {
        'If-None-Match': '*',
      },
      Expires: expirationSeconds,
    });

    return {
      method: 'POST',
      url,
      fields,
      expiresAt: new Date(Date.now() + expirationSeconds * 1000),
    };
  }

  async function createPresignedDownloadUrl(
    path: string,
    expiresIn?: number,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    return getSignedUrl(client, command, {
      expiresIn: expiresIn ?? PRESIGNED_S3_EXPIRATION_SECONDS,
    });
  }

  function getPublicUrl(path: string): string | undefined {
    if (!publicUrl) {
      return undefined;
    }
    return `${publicUrl.replace(/\/$/, '')}/${path}`;
  }

  async function deleteFile(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    await client.send(command);
  }

  async function deleteFiles(paths: string[]): Promise<{
    succeeded: string[];
    failed: { path: string; error: Error }[];
  }> {
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
    const succeeded: string[] = [];
    const failed: { path: string; error: Error }[] = [];

    if (response.Deleted) {
      succeeded.push(
        ...response.Deleted.map((obj) => obj.Key ?? '').filter(Boolean),
      );
    }

    if (response.Errors) {
      failed.push(
        ...response.Errors.map((error) => ({
          path: error.Key ?? '',
          error: new Error(error.Message ?? 'Unknown error'),
        })),
      );
    }

    return { succeeded, failed };
  }

  async function fileExists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: path,
      });
      await client.send(command);
      return true;
    } catch (error: unknown) {
      const err = error as {
        name?: string;
        $metadata?: { httpStatusCode?: number };
      };
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async function getFileMetadata(path: string): Promise<FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: path,
      });
      const response = await client.send(command);

      return {
        size: response.ContentLength ?? 0,
        contentType: response.ContentType ?? 'application/octet-stream',
        lastModified: response.LastModified ?? new Date(),
        etag: response.ETag?.replace(/"/g, ''),
      };
    } catch (error: unknown) {
      const err = error as {
        name?: string;
        $metadata?: { httpStatusCode?: number };
      };
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async function uploadFile(
    path: string,
    contents: Buffer | Readable,
    options?: UploadFileOptions,
  ): Promise<FileMetadata> {
    const upload = new Upload({
      client,
      params: {
        Bucket: bucket,
        Key: path,
        Body: contents,
        ContentType: options?.contentType,
        ServerSideEncryption: 'AES256',
      },
      partSize: options?.partSize,
      queueSize: options?.queueSize,
    });

    // Track progress if callback provided
    if (options?.onProgress) {
      upload.on('httpUploadProgress', (progress) => {
        const { loaded, total } = progress;
        const percentage =
          loaded && total ? Math.round((loaded / total) * 100) : undefined;
        options.onProgress?.({ loaded: loaded ?? 0, total, percentage });
      });
    }

    await upload.done();

    // Get metadata after upload to return accurate information
    const metadata = await getFileMetadata(path);
    if (!metadata) {
      throw new Error('Failed to get file metadata after upload');
    }

    return metadata;
  }

  async function downloadFile(path: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: path,
    });

    const response = await client.send(command);

    if (!response.Body) {
      throw new Error(`File ${path} not found or empty`);
    }

    return response.Body as Readable;
  }

  return {
    createPresignedUploadUrl,
    createPresignedDownloadUrl,
    getPublicUrl,
    deleteFile,
    deleteFiles,
    fileExists,
    getFileMetadata,
    uploadFile,
    downloadFile,
  };
};
