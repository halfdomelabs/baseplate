import { describe, expect, test } from 'vitest';

import { simpleDiffAlgorithm } from './simple-diff.js';

describe('simpleDiffAlgorithm', () => {
  test('should merge text with conflicts when there are differences', () => {
    const userText = '# This is a simple diff test\n\n' + 'Hello world\n';
    const newText =
      '# This is a simple diff test\n\nHello world\n\nThis is the new text\n';

    const result = simpleDiffAlgorithm(userText, newText);

    expect(result?.hasConflict).toBe(true);
    expect(result?.mergedText).toBe(
      '# This is a simple diff test\n\n' +
        'Hello world\n\n' +
        '<<<<<<< existing\n' +
        '=======\n' +
        'This is the new text\n\n' +
        '>>>>>>> baseplate',
    );
  });

  test('should return identical text when no differences', () => {
    const text = 'Hello world\n';

    const result = simpleDiffAlgorithm(text, text);

    expect(result?.hasConflict).toBe(false);
    expect(result?.mergedText).toBe('Hello world\n');
  });

  test('should handle empty strings', () => {
    const result = simpleDiffAlgorithm('', '');

    expect(result?.hasConflict).toBe(false);
    expect(result?.mergedText).toBe('');
  });
});
