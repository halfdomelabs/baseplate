import { test, describe, expect } from 'vitest';
import { computeRelativePath } from './path.js';

describe('computeRelativePath', () => {
  test('should compute relative path between sibling directories', () => {
    const fromPath = 'a/b/c';
    const toPath = 'a/b/d';
    const expectedRelativePath = '../d';
    expect(computeRelativePath(fromPath, toPath)).toBe(expectedRelativePath);
  });

  test('should compute relative path from child to parent directory', () => {
    const fromPath = 'a/b/c';
    const toPath = 'a/b';
    const expectedRelativePath = '..';
    expect(computeRelativePath(fromPath, toPath)).toBe(expectedRelativePath);
  });

  test('should compute no relative path for identical directories', () => {
    const fromPath = 'a/b/c';
    const toPath = 'a/b/c';
    const expectedRelativePath = '';
    expect(computeRelativePath(fromPath, toPath)).toBe(expectedRelativePath);
  });

  test('should compute a complex relative path', () => {
    const fromPath = 'a/b/c/d/e';
    const toPath = 'a/f/g';
    const expectedRelativePath = '../../../../f/g';
    expect(computeRelativePath(fromPath, toPath)).toBe(expectedRelativePath);
  });

  test('should compute relative path from base directory to another directory', () => {
    const fromPath = '.';
    const toPath = 'a/b';
    const expectedRelativePath = 'a/b';
    expect(computeRelativePath(fromPath, toPath)).toBe(expectedRelativePath);
  });

  test('should compute relative path from a directory to base directory', () => {
    const fromPath = 'a/b/c';
    const toPath = '';
    const expectedRelativePath = '../../..';
    expect(computeRelativePath(fromPath, toPath)).toBe(expectedRelativePath);
  });

  test('should relative path from a sibling ancestor directory to directory', () => {
    const fromPath = '../a/b';
    const toPath = '../c/d';
    const expectedRelativePath = '../../c/d';
    expect(computeRelativePath(fromPath, toPath)).toBe(expectedRelativePath);
  });
});
