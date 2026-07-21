import mime from 'mime-types';
import path from 'node:path';

export function getMimeTypeFromContentType(contentType: string): string {
  // MIME media types are case-insensitive, so normalize to lowercase to match
  // the `mime-types` lookup table and category allow-lists.
  return contentType.split(';')[0].trim().toLowerCase();
}

/**
 * Overrides for MIME types whose canonical extension from `mime-types` is not
 * the one people recognize (e.g. QuickTime is `.mov`, not `.qt`).
 */
const PREFERRED_EXTENSIONS: Record<string, string> = {
  'video/quicktime': 'mov',
};

/**
 * Maps MIME types to one familiar extension each (e.g. `image/jpeg` → `jpeg`),
 * for presenting a category's allowed types to the user. Unknown types are
 * dropped. Returns a sorted, de-duplicated list.
 */
export function getExtensionsForMimeTypes(
  mimeTypes: readonly string[],
): string[] {
  const extensions = new Set<string>();
  for (const mimeType of mimeTypes) {
    const extension =
      PREFERRED_EXTENSIONS[mimeType] ?? mime.extension(mimeType);
    if (extension) {
      extensions.add(extension);
    }
  }
  return [...extensions].toSorted();
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

/** Matches a syntactically valid `type/subtype` MIME string (case-insensitive). */
const MIME_TYPE_PATTERN = /^[a-z]+\/[a-z0-9!#$&^_.+-]+$/i;

/**
 * Why a file's declared mime type or filename was rejected.
 *
 * `UNRECOGNIZED_FILE_TYPE`: the declared type is empty or malformed.
 * `INVALID_FILE_EXTENSION`: the extension contradicts a well-formed type.
 */
export type InvalidMimeTypeCode =
  | 'UNRECOGNIZED_FILE_TYPE'
  | 'INVALID_FILE_EXTENSION';

/** Thrown when a declared mime type is unusable or contradicts its filename. */
export class InvalidMimeTypeError extends Error {
  constructor(
    message: string,
    public readonly code: InvalidMimeTypeCode,
    public readonly expectedFileExtensions?: string[],
  ) {
    super(message);
    this.name = 'InvalidMimeTypeError';
  }
}

/**
 * Asserts a declared mime type is well-formed. Only the shape is checked, so
 * vendor types (e.g. `application/vnd.acme+json`) pass; the category allow-list
 * decides what is permitted.
 *
 * @throws {InvalidMimeTypeError} If the value is empty or malformed.
 */
export function assertValidMimeType(mimeType: string): void {
  if (
    !mimeType ||
    typeof mimeType !== 'string' ||
    !MIME_TYPE_PATTERN.test(mimeType)
  ) {
    throw new InvalidMimeTypeError(
      `Invalid mime type: ${mimeType}. Must be a valid MIME type string.`,
      'UNRECOGNIZED_FILE_TYPE',
    );
  }
}

/**
 * Rejects a filename whose extension clearly contradicts its declared mime type.
 *
 * A lightweight consistency check on client metadata, not a content-safety check
 * — it never reads the file's bytes and only fires on unambiguous conflicts
 * (e.g. a `.jpg` declared `image/png`).
 *
 * @throws {InvalidMimeTypeError} If the extension maps to a known, different type.
 */
export function validateFileExtensionWithMimeType(
  mimeType: string,
  filename: string,
): void {
  if (mimeType === 'application/octet-stream') return;

  const extension = path.extname(filename).slice(1).toLowerCase();
  if (!extension) return;

  // Nothing to conflict with if the database cannot correlate the type.
  if (!(mimeType in mime.extensions)) return;
  const expectedExtensions = mime.extensions[mimeType];

  // An unrecognized extension is a database gap, not a conflict (e.g. `.jfif`).
  if (!mime.lookup(extension)) return;

  if (!expectedExtensions.includes(extension)) {
    throw new InvalidMimeTypeError(
      `The filename extension ".${extension}" does not match the declared file type "${mimeType}".`,
      'INVALID_FILE_EXTENSION',
      expectedExtensions,
    );
  }
}
