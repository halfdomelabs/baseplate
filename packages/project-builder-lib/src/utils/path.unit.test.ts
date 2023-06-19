import { computeRelativePath } from './path.js';

describe('computeRelativePath', () => {
  test('should compute relative path when target is in a different directory', () => {
    const fromPath = 'path/to/starting/file.txt';
    const toPath = 'path/to/target/directory/file.txt';

    const relativePath = computeRelativePath(fromPath, toPath);
    expect(relativePath).toBe('../../../target/directory/file.txt');
  });

  test('should compute relative path when target is in the same directory', () => {
    const fromPath = 'path/to/starting/file.txt';
    const toPath = 'path/to/starting/another-file.txt';

    const relativePath = computeRelativePath(fromPath, toPath);
    expect(relativePath).toBe('another-file.txt');
  });

  test('should compute relative path when target is in a subdirectory', () => {
    const fromPath = 'path/to/starting/file.txt';
    const toPath = 'path/to/starting/subdirectory/other-file.txt';

    const relativePath = computeRelativePath(fromPath, toPath);
    expect(relativePath).toBe('subdirectory/other-file.txt');
  });

  test('should compute relative path when target is in a parent directory', () => {
    const fromPath = 'path/to/starting/file.txt';
    const toPath = 'path/to/other-file.txt';

    const relativePath = computeRelativePath(fromPath, toPath);
    expect(relativePath).toBe('../other-file.txt');
  });
});
