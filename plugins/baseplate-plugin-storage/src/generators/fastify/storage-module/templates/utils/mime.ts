// @ts-nocheck

import mime from 'mime-types';
import { extname } from 'path';

export function getMimeTypeFromContentType(contentType: string): string {
  return contentType.split(':')[0];
}

export function validateFileExtensionWithMimeType(
  mimeType: string,
  fileName: string,
): void {
  const extensions = mime.extensions[mimeType];
  if (!extensions) {
    throw new Error(`Invalid mime type ${mimeType}`);
  }
  const extension = extname(fileName).substring(1).toLowerCase();
  if (!extensions.includes(extension)) {
    throw new Error(
      `File extension ${extension} does not match mime type ${mimeType}`,
    );
  }
}
