import { describe, expect, it } from 'vitest';

import type { TextTemplateFileVariable } from './types.js';

import { getTextTemplateVariableRegExp } from './utils.js';

describe('getTextTemplateVariableRegExp', () => {
  describe('when variable is an identifier', () => {
    const variable: TextTemplateFileVariable = { isIdentifier: true };

    it('should create regex that matches standalone identifiers', () => {
      const regex = getTextTemplateVariableRegExp(variable, 'testVar');
      expect('testVar').toMatch(regex);
      expect('testVar123').not.toMatch(regex);
      expect('123testVar').not.toMatch(regex);
      expect('my testVar here').toMatch(regex);
      expect('my_testVar_here').not.toMatch(regex);
    });

    it('should handle special characters in the value', () => {
      const regex = getTextTemplateVariableRegExp(variable, 'test.var');
      expect('test.var').toMatch(regex);
      expect('test.var123').not.toMatch(regex);
      expect('my test.var here').toMatch(regex);
    });
  });

  describe('when variable is not an identifier', () => {
    const variable: TextTemplateFileVariable = { isIdentifier: false };

    it('should create regex that matches the exact value anywhere', () => {
      const regex = getTextTemplateVariableRegExp(variable, 'testVar');
      expect('testVar').toMatch(regex);
      expect('testVar123').toMatch(regex);
      expect('123testVar').toMatch(regex);
      expect('my testVar here').toMatch(regex);
      expect('my_testVar_here').toMatch(regex);
    });

    it('should handle special characters in the value', () => {
      const regex = getTextTemplateVariableRegExp(variable, 'test.var');
      expect('test.var').toMatch(regex);
      expect('test.var123').toMatch(regex);
      expect('my test.var here').toMatch(regex);
    });
  });
});
