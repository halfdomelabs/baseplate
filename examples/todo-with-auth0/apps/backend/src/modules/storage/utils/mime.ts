import mime from 'mime-types';
import path from 'node:path';

export function getMimeTypeFromContentType(contentType: string): string {
  return contentType.split(';')[0].trim();
}

export function getEncodingFromContentType(
  contentType: string,
): string | undefined {
  // Match charset in content type, e.g., text/html; charset=UTF-8
  const match = /charset\s*=\s*["']?([^;"'\s]+)/i.exec(contentType);
  if (!match) return undefined;

  const charset = match[1].trim().toLowerCase();

  // Node.js uses Buffer.isEncoding for valid encodings
  return Buffer.isEncoding(charset) ? charset : 'utf-8';
}

export class InvalidMimeTypeError extends Error {
  constructor(
    message: string,
    public readonly expectedFileExtensions: string[],
  ) {
    super(message);
    this.name = 'InvalidMimeTypeError';
  }
}

export function validateFileExtensionWithMimeType(
  mimeType: string,
  filename: string,
): void {
  if (!mimeType || typeof mimeType !== 'string') {
    throw new Error(
      `Invalid mime type: ${mimeType}. Must be a valid MIME type string.`,
    );
  }

  if (!(mimeType in mime.extensions)) {
    throw new Error(
      `Unsupported mime type: ${mimeType}. Please use a supported file type.`,
    );
  }

  const extensions = mime.extensions[mimeType];
  const extension = path.extname(filename).slice(1).toLowerCase();

  if (!extension) {
    throw new Error(`File "${filename}" must have a file extension.`);
  }

  if (!extensions.includes(extension)) {
    throw new InvalidMimeTypeError(
      `File extension ".${extension}" does not match mime type "${mimeType}". Expected one of: ${extensions.map((ext) => `.${ext}`).join(', ')}`,
      extensions,
    );
  }
}
