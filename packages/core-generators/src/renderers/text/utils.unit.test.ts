import { describe, expect, it } from 'vitest';

import { getTextTemplateVariableRegExp } from './utils.js';

describe('getTextTemplateVariableRegExp', () => {
  describe('when variable is an identifier', () => {
    it('should create regex that matches standalone identifiers', () => {
      const regex = getTextTemplateVariableRegExp('testVar');
      expect('testVar').toMatch(regex);
      expect('testVar123').not.toMatch(regex);
      expect('123testVar').not.toMatch(regex);
      expect('my testVar here').toMatch(regex);
      expect('my_testVar_here').not.toMatch(regex);
    });

    it('should handle special characters in the value', () => {
      const regex = getTextTemplateVariableRegExp('test.var');
      expect('test.var').toMatch(regex);
      expect('test.var123').not.toMatch(regex);
      expect('my test.var here').toMatch(regex);
    });
  });
});
