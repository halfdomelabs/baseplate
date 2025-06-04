import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { safePathJoin } from './safe-path-join.js';

describe('safePathJoin', () => {
  describe('valid paths', () => {
    it('should join simple paths', () => {
      const result = safePathJoin('/home/user', 'documents', 'file.txt');
      expect(result).toBe(path.resolve('/home/user/documents/file.txt'));
    });

    it('should handle single segment', () => {
      const result = safePathJoin('/home/user', 'file.txt');
      expect(result).toBe(path.resolve('/home/user/file.txt'));
    });

    it('should handle no segments (returns parent)', () => {
      const result = safePathJoin('/home/user');
      expect(result).toBe(path.resolve('/home/user'));
    });

    it('should handle empty segments', () => {
      const result = safePathJoin(
        '/home/user',
        '',
        'documents',
        '',
        'file.txt',
      );
      expect(result).toBe(path.resolve('/home/user/documents/file.txt'));
    });

    it('should normalize paths with . and .. that stay within bounds', () => {
      const result = safePathJoin('/home/user', 'docs/../documents/./file.txt');
      expect(result).toBe(path.resolve('/home/user/documents/file.txt'));
    });

    it('should handle nested directories', () => {
      const result = safePathJoin('/home/user', 'a/b/c/d/e/file.txt');
      expect(result).toBe(path.resolve('/home/user/a/b/c/d/e/file.txt'));
    });

    it('should handle relative parent directory', () => {
      const cwd = process.cwd();
      const result = safePathJoin('relative/path', 'file.txt');
      expect(result).toBe(path.resolve(cwd, 'relative/path/file.txt'));
    });

    it('should handle parent directory with trailing slash', () => {
      const result = safePathJoin('/home/user/', 'documents', 'file.txt');
      expect(result).toBe(path.resolve('/home/user/documents/file.txt'));
    });

    it('should handle complex valid traversal', () => {
      const result = safePathJoin('/home/user', 'a/b/../c/./d/../e/file.txt');
      expect(result).toBe(path.resolve('/home/user/a/c/e/file.txt'));
    });
  });

  describe('invalid paths - directory traversal', () => {
    it('should throw on simple parent directory escape', () => {
      expect(() => safePathJoin('/home/user', '../other')).toThrow(
        'Path traversal detected',
      );
    });

    it('should throw on multiple parent directory escapes', () => {
      expect(() => safePathJoin('/home/user', '../../etc/passwd')).toThrow(
        'Path traversal detected',
      );
    });

    it('should throw on hidden traversal in the middle', () => {
      expect(() => safePathJoin('/home/user', 'documents/../../other')).toThrow(
        'Path traversal detected',
      );
    });

    it('should throw on traversal at the end', () => {
      expect(() =>
        safePathJoin('/home/user', 'documents/secret/../../..'),
      ).toThrow('Path traversal detected');
    });

    it('should throw on absolute path segment', () => {
      expect(() => safePathJoin('/home/user', '/etc/passwd')).toThrow(
        'Path traversal detected',
      );
    });

    it('should throw on complex traversal attempt', () => {
      expect(() => safePathJoin('/home/user', './../../etc/passwd')).toThrow(
        'Path traversal detected',
      );
    });

    it('should include paths in error message', () => {
      try {
        safePathJoin('/home/user', '../other');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('/home/user');
        expect((error as Error).message).toContain('Path traversal detected');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle root directory as parent', () => {
      const result = safePathJoin('/', 'etc', 'hosts');
      expect(result).toBe(path.resolve('/etc/hosts'));
    });

    it('should handle trying to escape root (normalizes to root)', () => {
      // Note: path.resolve('/', '..') normalizes to '/' on Unix systems
      // This is correct behavior as you can't go above root
      const result = safePathJoin('/', '..');
      expect(result).toBe(path.resolve('/'));
    });

    it('should handle Windows paths', () => {
      // This test will behave differently on Windows vs Unix
      if (process.platform === 'win32') {
        const result = safePathJoin(
          String.raw`C:\Users\John`,
          'Documents',
          'file.txt',
        );
        expect(result).toBe(
          path.resolve(String.raw`C:\Users\John\Documents\file.txt`),
        );
      }
    });

    it('should handle paths with special characters', () => {
      const result = safePathJoin(
        '/home/user',
        'my docs & files',
        'report (1).pdf',
      );
      expect(result).toBe(
        path.resolve('/home/user/my docs & files/report (1).pdf'),
      );
    });

    it('should handle unicode characters', () => {
      const result = safePathJoin('/home/user', '文档', '报告.pdf');
      expect(result).toBe(path.resolve('/home/user/文档/报告.pdf'));
    });
  });
});
