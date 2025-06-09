import { describe, expect, it } from 'vitest';

import { normalizePathSeparators } from './normalize-path-separators.js';

describe('normalizePathSeparators', () => {
  it('should convert Windows separators to Unix separators', () => {
    const windowsPath = String.raw`src\components\Button.tsx`;
    const result = normalizePathSeparators(windowsPath);
    expect(result).toBe('src/components/Button.tsx');
  });

  it('should leave Unix separators unchanged', () => {
    const unixPath = 'src/components/Button.tsx';
    const result = normalizePathSeparators(unixPath);
    expect(result).toBe('src/components/Button.tsx');
  });
});
