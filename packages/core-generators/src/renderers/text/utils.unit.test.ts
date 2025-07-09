import { describe, expect, it } from 'vitest';

import {
  extractTemplateVariables,
  getTextTemplateDelimiters,
  getTextTemplateVariableRegExp,
} from './utils.js';

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

describe('getTextTemplateDelimiters', () => {
  it('should return CSS delimiters for .css files', () => {
    const result = getTextTemplateDelimiters('styles.css');
    expect(result).toEqual({
      start: '/* ',
      end: ' */',
    });
  });

  it('should return empty delimiters for .gql files', () => {
    const result = getTextTemplateDelimiters('query.gql');
    expect(result).toEqual({
      start: '',
      end: '',
    });
  });

  it('should return YAML delimiters for .yml files', () => {
    const result = getTextTemplateDelimiters('config.yml');
    expect(result).toEqual({
      start: '${{',
      end: '}}',
    });
  });

  it('should return default delimiters for other files', () => {
    const result = getTextTemplateDelimiters('component.tsx');
    expect(result).toEqual({
      start: '{{',
      end: '}}',
    });
  });
});

describe('extractTemplateVariables', () => {
  it('should return original contents when empty variables provided', () => {
    const contents = 'const name = "test";';
    const result = extractTemplateVariables(contents, {}, 'test.ts');
    expect(result).toBe(contents);
  });

  it('should replace variable values with template placeholders', () => {
    const contents =
      'const MyComponent = () => { return <div>Hello World</div>; };';
    const variables: Record<string, string> = {
      componentName: 'MyComponent',
      message: 'Hello World',
    };

    const result = extractTemplateVariables(
      contents,
      variables,
      'component.tsx',
    );
    expect(result).toBe(
      'const {{componentName}} = () => { return <div>{{message}}</div>; };',
    );
  });

  it('should use CSS delimiters for .css files', () => {
    const contents = '.my-class { color: red; }';
    const variables: Record<string, string> = {
      className: 'my-class',
    };

    const result = extractTemplateVariables(contents, variables, 'styles.css');
    expect(result).toBe('./* className */ { color: red; }');
  });

  it('should use empty delimiters for .gql files', () => {
    const contents = 'query GetUser { user { name } }';
    const variables: Record<string, string> = {
      queryName: 'GetUser',
    };

    const result = extractTemplateVariables(contents, variables, 'query.gql');
    expect(result).toBe('query queryName { user { name } }');
  });

  it('should handle overlapping variable values by processing longer values first', () => {
    const contents =
      'const MyComponentProps = {}; const MyComponent = () => {};';
    const variables: Record<string, string> = {
      componentName: 'MyComponent',
      propsName: 'MyComponentProps',
    };

    const result = extractTemplateVariables(
      contents,
      variables,
      'component.tsx',
    );
    expect(result).toBe(
      'const {{propsName}} = {}; const {{componentName}} = () => {};',
    );
  });

  it('should throw error when variable value is not found', () => {
    const contents = 'const SomeOtherComponent = () => {};';
    const variables: Record<string, string> = {
      componentName: 'MyComponent',
    };

    expect(() => {
      extractTemplateVariables(contents, variables, 'component.tsx');
    }).toThrow('Variable componentName with value MyComponent not found');
  });

  it('should respect word boundaries when replacing variables', () => {
    const contents =
      'const MyComponentWrapper = () => { return <MyComponent />; };';
    const variables: Record<string, string> = {
      componentName: 'MyComponent',
    };

    const result = extractTemplateVariables(
      contents,
      variables,
      'component.tsx',
    );
    expect(result).toBe(
      'const MyComponentWrapper = () => { return <{{componentName}} />; };',
    );
  });
});
