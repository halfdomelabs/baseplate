/**
 * A named group of MIME types offered as a shortcut in the file category editor.
 */
interface MimeTypeGroup {
  /** Stable identifier for the group. */
  value: string;
  /** Human-readable label shown on the shortcut button. */
  label: string;
  /** The MIME types added to a category when the shortcut is used. */
  mimeTypes: string[];
}

/**
 * MIME type groups offered as shortcuts when configuring a file category.
 *
 * Every value here must be resolvable by the `mime-types` package used by the
 * generated backend, since {@link https://www.npmjs.com/package/mime-types}
 * powers the extension check that runs before the allow-list check. A MIME type
 * absent from that map is rejected as an unsupported type rather than as a
 * disallowed one.
 */
export const MIME_TYPE_GROUPS: MimeTypeGroup[] = [
  {
    value: 'images',
    label: 'Images',
    mimeTypes: [
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/webp',
    ],
  },
  {
    value: 'videos',
    label: 'Videos',
    mimeTypes: [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/webm',
      'video/x-msvideo',
    ],
  },
  {
    value: 'documents',
    label: 'Documents',
    mimeTypes: [
      'application/msword',
      'application/pdf',
      'application/rtf',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'text/plain',
    ],
  },
];

/**
 * Matches a `type/subtype` MIME string, e.g. `image/png` or
 * `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
 */
const MIME_TYPE_PATTERN = /^[a-z]+\/[a-z0-9!#$&^_.+-]+$/i;

/**
 * Validates a MIME type entered by hand in the file category editor.
 *
 * This only checks the shape of the string. The generated backend additionally
 * requires the MIME type to be known to the `mime-types` package, so an
 * obscure-but-well-formed type may still be rejected at upload time.
 *
 * @param mimeType - The MIME type to validate.
 * @returns True if the value is a well-formed MIME type.
 */
export function isValidMimeType(mimeType: string): boolean {
  return MIME_TYPE_PATTERN.test(mimeType);
}
