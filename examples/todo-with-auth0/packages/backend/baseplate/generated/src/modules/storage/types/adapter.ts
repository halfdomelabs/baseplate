import type { Readable } from 'node:stream';

/**
 * Metadata about a stored file
 */
export interface FileMetadata {
  /** File size in bytes */
  size: number;
  /** MIME type of the file */
  contentType: string;
  /** Last modification timestamp */
  lastModified: Date;
  /** Entity tag for caching (if supported by adapter) */
  etag?: string;
}

/**
 * Configuration for creating a presigned upload URL
 */
export interface CreatePresignedUploadOptions {
  /** Storage path where the file will be uploaded */
  path: string;
  /** Expected MIME type of the upload */
  contentType?: string;
  /** Allowed file size range in bytes [min, max] */
  contentLengthRange?: [min: number, max: number];
  /** URL expiration time in seconds (default: 3600) */
  expiresIn?: number;
}

/**
 * Presigned upload URL details
 */
export interface PresignedUploadUrl {
  /** The URL to upload to */
  url: string;
  /** HTTP method to use for upload */
  method: 'POST' | 'PUT';
  /** Form fields to include with POST requests (empty for PUT) */
  fields: Record<string, string>;
  /** When this presigned URL expires */
  expiresAt: Date;
}

/**
 * Progress information for multipart uploads
 */
export interface UploadProgress {
  /** Number of bytes uploaded so far */
  loaded: number;
  /** Total number of bytes to upload (if known) */
  total?: number;
  /** Upload percentage (0-100) */
  percentage?: number;
}

/**
 * Options for uploading a file
 */
export interface UploadFileOptions {
  /** MIME type of the file (e.g., 'image/jpeg', 'application/pdf') */
  contentType?: string;
  /** Callback for tracking upload progress (multipart uploads only) */
  onProgress?: (progress: UploadProgress) => void;
  /** Part size in bytes for multipart uploads (default: 5MB, min: 5MB, max: 5GB) */
  partSize?: number;
  /** Number of concurrent part uploads (default: 4) */
  queueSize?: number;
}

/**
 * Storage adapter interface for file operations.
 * Implementations may use S3, local filesystem, GCS, etc.
 */
export interface StorageAdapter {
  /**
   * Upload a file to storage
   *
   * @param path - Storage path (e.g., 'uploads/avatars/user123.jpg')
   * @param contents - File contents as Buffer or Readable stream
   * @param options - Optional upload options (e.g., contentType)
   * @returns Metadata about the uploaded file
   * @throws {Error} If upload fails
   *
   * @example
   * const metadata = await adapter.uploadFile(
   *   'uploads/avatar.jpg',
   *   Buffer.from(imageData),
   *   { contentType: 'image/jpeg' }
   * );
   */
  uploadFile(
    path: string,
    contents: Buffer | Readable,
    options?: UploadFileOptions,
  ): Promise<FileMetadata>;

  /**
   * Download a file from storage
   *
   * @param path - Storage path of the file
   * @returns Readable stream of file contents
   * @throws {Error} If file doesn't exist or download fails
   *
   * @example
   * const stream = await adapter.downloadFile('uploads/avatar.jpg');
   * stream.pipe(response);
   */
  downloadFile(path: string): Promise<Readable>;

  /**
   * Delete a single file from storage
   *
   * @param path - Storage path of the file to delete
   * @throws {Error} If deletion fails (file not existing is not an error)
   */
  deleteFile?(path: string): Promise<void>;

  /**
   * Delete multiple files from storage
   *
   * @param paths - Array of storage paths to delete
   * @returns Results indicating which deletions succeeded/failed
   *
   * @example
   * const results = await adapter.deleteFiles(['file1.jpg', 'file2.jpg']);
   * console.log(`Deleted: ${results.succeeded.length} files`);
   * console.log(`Failed: ${results.failed.length} files`);
   */
  deleteFiles?(paths: string[]): Promise<{
    succeeded: string[];
    failed: { path: string; error: Error }[];
  }>;

  /**
   * Check if a file exists in storage
   *
   * @param path - Storage path to check
   * @returns true if file exists, false otherwise
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Get metadata about a file without downloading it
   *
   * @param path - Storage path of the file
   * @returns File metadata or null if file doesn't exist
   */
  getFileMetadata(path: string): Promise<FileMetadata | null>;

  /**
   * Create a presigned URL for direct browser uploads.
   * Only implement if adapter supports presigned URLs (e.g., S3).
   *
   * @param options - Upload configuration
   * @returns Presigned URL details for client-side upload
   * @throws {Error} If adapter doesn't support presigned URLs
   *
   * @example
   * const presigned = await adapter.createPresignedUploadUrl({
   *   path: 'uploads/document.pdf',
   *   contentType: 'application/pdf',
   *   contentLengthRange: [1024, 10485760], // 1KB to 10MB
   *   expiresIn: 300 // 5 minutes
   * });
   */
  createPresignedUploadUrl?(
    options: CreatePresignedUploadOptions,
  ): Promise<PresignedUploadUrl>;

  /**
   * Create a presigned URL for temporary file access.
   * Only implement if adapter supports presigned URLs.
   *
   * @param path - Storage path of the file
   * @param expiresIn - URL expiration in seconds (default: 3600)
   * @returns Temporary download URL
   * @throws {Error} If file doesn't exist or adapter doesn't support presigned URLs
   */
  createPresignedDownloadUrl?(
    path: string,
    expiresIn?: number,
  ): Promise<string>;

  /**
   * Get a permanent public URL for a file.
   * Only implement if adapter supports public URLs (e.g., CDN).
   *
   * @param path - Storage path of the file
   * @returns Public URL or undefined if not publicly accessible
   *
   * @example
   * const publicUrl = adapter.getPublicUrl('assets/logo.png');
   * // Returns: 'https://cdn.example.com/assets/logo.png'
   */
  getPublicUrl?(path: string): string | undefined;
}
