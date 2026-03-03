import { describe, expect, it } from 'vitest';

import {
  getEncodingFromContentType,
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

describe('validateFileExtensionWithMimeType', () => {
  it.each([
    { mimeType: 'text/html', filename: 'test.html' },
    { mimeType: 'image/jpeg', filename: 'image.jpg' },
    { mimeType: 'image/jpeg', filename: 'image.jpeg' },
    { mimeType: 'application/json', filename: 'data.json' },
    { mimeType: 'text/plain', filename: 'readme.txt' },
  ])('should match $filename as $mimeType', ({ mimeType, filename }) => {
    expect(() => {
      validateFileExtensionWithMimeType(mimeType, filename);
    }).not.toThrow();
  });

  it.each([
    { mimeType: 'text/html', filename: 'test.html5' },
    { mimeType: 'image/jpeg', filename: 'image.exe' },
    { mimeType: 'application/json', filename: 'data.xml' },
  ])('should not match $filename as $mimeType', ({ mimeType, filename }) => {
    expect(() => {
      validateFileExtensionWithMimeType(mimeType, filename);
    }).toThrow();
  });

  it('should throw InvalidExtensionError with expected extensions', () => {
    expect(() => {
      validateFileExtensionWithMimeType('image/jpeg', 'image.png');
    }).toThrow(
      expect.objectContaining({
        name: 'InvalidMimeTypeError',
        expectedFileExtensions: expect.arrayContaining([
          'jpg',
          'jpeg',
        ]) as string[],
      }) as Error,
    );
  });

  it('should throw error for invalid mime type', () => {
    expect(() => {
      validateFileExtensionWithMimeType('invalid/mime', 'test.txt');
    }).toThrow('Unsupported mime type: invalid/mime');
  });

  it('should throw error for empty mime type', () => {
    expect(() => {
      validateFileExtensionWithMimeType('', 'test.txt');
    }).toThrow('Invalid mime type: ');
  });

  it('should throw error for non-string mime type', () => {
    expect(() => {
      validateFileExtensionWithMimeType(null as unknown as string, 'test.txt');
    }).toThrow('Invalid mime type: null');
  });

  it('should throw error for file without extension', () => {
    expect(() => {
      validateFileExtensionWithMimeType('text/plain', 'filename');
    }).toThrow('File "filename" must have a file extension.');
  });
});
