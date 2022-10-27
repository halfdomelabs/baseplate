import { Readable } from 'stream';

export interface PresignedUrlField {
  name: string;
  value: string;
}

export interface AdapterPresignedUploadUrlPayload {
  url: string;
  method: 'POST' | 'PUT';
  fields?: PresignedUrlField[];
}

export interface AdapterPresignedUploadUrlInput {
  path: string;
  contentType?: string;
  minFileSize?: number;
  maxFileSize: number;
}

export interface StorageAdapter {
  createPresignedUploadUrl?: (
    input: AdapterPresignedUploadUrlInput
  ) => Promise<AdapterPresignedUploadUrlPayload>;
  createPresignedDownloadUrl?: (path: string) => Promise<string>;
  getHostedUrl?: (path: string) => string | null;
  uploadFile?: (
    path: string,
    contents: Buffer | ReadableStream | string
  ) => Promise<void>;
  downloadFile?: (path: string) => Promise<Readable>;
}
