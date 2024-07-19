// @ts-nocheck

import { validateFileExtensionWithMimeType } from './mime';

describe('validateFileExtensionWithMimeType', () => {
  it.each([
    { mimeType: 'text/html', fileName: 'test.html' },
    { mimeType: 'image/jpeg', fileName: 'image.jpg' },
    { mimeType: 'image/jpeg', fileName: 'image.jpeg' },
  ])('should match $fileName as $mimeType', ({ mimeType, fileName }) => {
    expect(() => {
      validateFileExtensionWithMimeType(mimeType, fileName);
    }).not.toThrow();
  });

  it.each([
    { mimeType: 'text/html', fileName: 'test.html5' },
    { mimeType: 'text/jpeg', fileName: 'image.exe' },
  ])('should not match $fileName as $mimeType', ({ mimeType, fileName }) => {
    expect(() => {
      validateFileExtensionWithMimeType(mimeType, fileName);
    }).toThrow();
  });
});
