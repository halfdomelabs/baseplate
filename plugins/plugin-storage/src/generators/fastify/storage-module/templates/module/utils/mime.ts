// @ts-nocheck

import mime from 'mime-types';
import path from 'node:path';

export function getMimeTypeFromContentType(contentType: string): string {
  return contentType.split(':')[0];
}

export function validateFileExtensionWithMimeType(
  mimeType: string,
  fileName: string,
): void {
  if (!(mimeType in mime.extensions)) {
    throw new Error(`Invalid mime type ${mimeType}`);
  }
  const extensions = mime.extensions[mimeType];
  const extension = path.extname(fileName).slice(1).toLowerCase();
  if (!extensions.includes(extension)) {
    throw new Error(
      `File extension ${extension} does not match mime type ${mimeType}`,
    );
  }
}
