import { describe, expect, it } from 'vitest';

import {
  assertValidMimeType,
  getEncodingFromContentType,
  getExtensionsForMimeTypes,
  getMimeTypeFromContentType,
  validateFileExtensionWithMimeType,
} from './mime.js';

describe('getMimeTypeFromContentType', () => {
  it.each([
    { contentType: 'text/html', expected: 'text/html' },
    { contentType: 'text/html; charset=UTF-8', expected: 'text/html' },
    {
      contentType: 'application/json; charset=utf-8',
      expected: 'application/json',
    },
    { contentType: 'image/jpeg', expected: 'image/jpeg' },
    {
      contentType: 'multipart/form-data; boundary=----WebKitFormBoundary',
      expected: 'multipart/form-data',
    },
  ])(
    'should extract "$expected" from "$contentType"',
    ({ contentType, expected }) => {
      expect(getMimeTypeFromContentType(contentType)).toBe(expected);
    },
  );

  it('should handle content type with multiple parameters', () => {
    const contentType = 'text/html; charset=UTF-8; version=1.0';
    expect(getMimeTypeFromContentType(contentType)).toBe('text/html');
  });

  it.each([
    { contentType: 'IMAGE/PNG', expected: 'image/png' },
    { contentType: 'Image/Jpeg', expected: 'image/jpeg' },
    {
      contentType: 'APPLICATION/PDF; charset=UTF-8',
      expected: 'application/pdf',
    },
  ])(
    'should normalize casing, extracting "$expected" from "$contentType"',
    ({ contentType, expected }) => {
      expect(getMimeTypeFromContentType(contentType)).toBe(expected);
    },
  );
});

describe('getExtensionsForMimeTypes', () => {
  it('resolves MIME types to their canonical extensions', () => {
    expect(
      getExtensionsForMimeTypes(['image/jpeg', 'image/png', 'image/webp']),
    ).toEqual(['jpeg', 'png', 'webp']);
  });

  it('uses a single canonical extension per type', () => {
    // image/jpeg permits jpe/jpg/jpeg, but only the canonical one is shown.
    expect(getExtensionsForMimeTypes(['image/jpeg'])).toEqual(['jpeg']);
  });

  it('prefers the familiar extension over an obscure canonical one', () => {
    // The mime-types canonical for QuickTime is "qt", but users expect "mov".
    expect(getExtensionsForMimeTypes(['video/quicktime'])).toEqual(['mov']);
  });

  it('de-duplicates and sorts the result', () => {
    expect(getExtensionsForMimeTypes(['image/png', 'image/png'])).toEqual([
      'png',
    ]);
  });

  it('ignores unknown MIME types', () => {
    expect(getExtensionsForMimeTypes(['image/png', 'not/real'])).toEqual([
      'png',
    ]);
  });

  it('returns an empty array for an empty input', () => {
    expect(getExtensionsForMimeTypes([])).toEqual([]);
  });
});

describe('getEncodingFromContentType', () => {
  it.each([
    { contentType: 'text/html; charset=UTF-8', expected: 'utf-8' },
    { contentType: 'text/html; charset=utf-8', expected: 'utf-8' },
    { contentType: 'text/html; charset=latin1', expected: 'latin1' },
    { contentType: 'application/json; charset=ascii', expected: 'ascii' },
    { contentType: 'text/plain; charset="UTF-8"', expected: 'utf-8' },
    { contentType: "text/plain; charset='UTF-8'", expected: 'utf-8' },
  ])(
    'should extract "$expected" encoding from "$contentType"',
    ({ contentType, expected }) => {
      expect(getEncodingFromContentType(contentType)).toBe(expected);
    },
  );

  it.each([
    { contentType: 'text/html' },
    { contentType: 'application/json' },
    { contentType: 'image/jpeg' },
    { contentType: 'text/html; boundary=----WebKitFormBoundary' },
  ])(
    'should return undefined for content type without charset: "$contentType"',
    ({ contentType }) => {
      expect(getEncodingFromContentType(contentType)).toBeUndefined();
    },
  );

  it('should return undefined for non-string input', () => {
    expect(
      getEncodingFromContentType(null as unknown as string),
    ).toBeUndefined();
    expect(
      getEncodingFromContentType(undefined as unknown as string),
    ).toBeUndefined();
    expect(
      getEncodingFromContentType(123 as unknown as string),
    ).toBeUndefined();
  });

  it('should return utf-8 for invalid charset', () => {
    expect(
      getEncodingFromContentType('text/html; charset=INVALID-CHARSET'),
    ).toBe('utf-8');
  });
});

describe('assertValidMimeType', () => {
  it.each([
    'image/png',
    'application/pdf',
    'application/octet-stream',
    // Vendor / structured-suffix types unknown to the mime database are valid.
    'application/vnd.acme+json',
    'application/x-zip-compressed',
  ])('accepts the well-formed mime type "%s"', (mimeType) => {
    expect(() => {
      assertValidMimeType(mimeType);
    }).not.toThrow();
  });

  it.each([
    { mimeType: '', label: 'empty' },
    { mimeType: 'image', label: 'no subtype' },
    { mimeType: 'not a mime type', label: 'spaces' },
    { mimeType: null as unknown as string, label: 'null' },
  ])(
    'throws UNRECOGNIZED_FILE_TYPE for a malformed mime type ($label)',
    ({ mimeType }) => {
      expect(() => {
        assertValidMimeType(mimeType);
      }).toThrow(
        expect.objectContaining({
          name: 'InvalidMimeTypeError',
          code: 'UNRECOGNIZED_FILE_TYPE',
        }) as Error,
      );
    },
  );
});

describe('validateFileExtensionWithMimeType', () => {
  it.each([
    // Consistent extension/type pairs.
    { mimeType: 'image/jpeg', filename: 'image.jpg' },
    { mimeType: 'image/jpeg', filename: 'image.jpeg' },
    { mimeType: 'text/plain', filename: 'readme.txt' },
    // Generic binary is always allowed regardless of extension.
    { mimeType: 'application/octet-stream', filename: 'archive.zip' },
    // No extension is allowed.
    { mimeType: 'text/plain', filename: 'filename' },
    // Extensions the mime database does not recognize are treated as a gap,
    // not a conflict (e.g. .jfif is a real JPEG extension mime-types omits).
    { mimeType: 'image/jpeg', filename: 'image.jfif' },
    // Types the mime database cannot correlate are allowed.
    { mimeType: 'application/vnd.acme+json', filename: 'data.acme' },
  ])('allows $filename declared as $mimeType', ({ mimeType, filename }) => {
    expect(() => {
      validateFileExtensionWithMimeType(mimeType, filename);
    }).not.toThrow();
  });

  it('rejects an extension that clearly contradicts the declared type', () => {
    // .jpg is a recognized extension mapping to image/jpeg, not image/png.
    expect(() => {
      validateFileExtensionWithMimeType('image/png', 'photo.jpg');
    }).toThrow(
      expect.objectContaining({
        name: 'InvalidMimeTypeError',
        code: 'INVALID_FILE_EXTENSION',
        expectedFileExtensions: expect.arrayContaining(['png']) as string[],
      }) as Error,
    );
  });
});
