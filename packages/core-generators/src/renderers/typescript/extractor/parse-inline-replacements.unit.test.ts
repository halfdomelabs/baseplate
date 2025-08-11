import { describe, expect, it } from 'vitest';

import {
  generateInlineReplacementComments,
  isValidInlineReplacementValue,
  parseInlineReplacements,
} from './parse-inline-replacements.js';

describe('parseInlineReplacements', () => {
  it('should parse basic inline replacement comments', () => {
    const content = `
      import { UserDocument } from './types.js';
      
      /* TPL_COMPONENT_NAME=UserEditPage */
      /* TPL_ROUTE_PATH=/admin/users/$id */
      /* TPL_USER_TYPE=User */
      
      function UserEditPage() {
        return <div>Hello</div>;
      }
    `;

    const result = parseInlineReplacements(content);

    expect(result.replacements).toEqual({
      UserEditPage: 'TPL_COMPONENT_NAME',
      '/admin/users/$id': 'TPL_ROUTE_PATH',
      User: 'TPL_USER_TYPE',
    });

    // Comments should be removed from content
    expect(result.content).not.toContain(
      '/* TPL_COMPONENT_NAME=UserEditPage */',
    );
    expect(result.content).not.toContain(
      '/* TPL_ROUTE_PATH=/admin/users/$id */',
    );
    expect(result.content).not.toContain('/* TPL_USER_TYPE=User */');

    // Original code should remain
    expect(result.content).toContain('function UserEditPage()');
    expect(result.content).toContain('import { UserDocument }');
  });

  it('should handle various valid value types', () => {
    const content = `
      /* TPL_COMPONENT_NAME=UserEditPage */
      /* TPL_ROUTE_PATH=/admin/accounts/users/$id */
      /* TPL_CSS_CLASS=user-edit-form */
      /* TPL_COUNT=42 */
      /* TPL_ENABLED=true */
      /* TPL_MODULE_PATH=./components/user-form */
      /* TPL_API_PATH=/api/v1/users.json */
    `;

    const result = parseInlineReplacements(content);

    expect(result.replacements).toEqual({
      UserEditPage: 'TPL_COMPONENT_NAME',
      '/admin/accounts/users/$id': 'TPL_ROUTE_PATH',
      'user-edit-form': 'TPL_CSS_CLASS',
      '42': 'TPL_COUNT',
      true: 'TPL_ENABLED',
      './components/user-form': 'TPL_MODULE_PATH',
      '/api/v1/users.json': 'TPL_API_PATH',
    });
  });

  it('should throw error for invalid characters in values', () => {
    const content = '/* TPL_COMPLEX_EXPR=data?.user?.email */';

    expect(() => parseInlineReplacements(content)).toThrow(
      'Invalid replacement value "data?.user?.email" for TPL_COMPLEX_EXPR',
    );
  });

  it('should throw error for values with quotes', () => {
    const content = '/* TPL_STRING_VALUE="hello world" */';

    expect(() => parseInlineReplacements(content)).toThrow(
      'Invalid replacement value ""hello world"" for TPL_STRING_VALUE',
    );
  });

  it('should throw error for values with special operators', () => {
    const content = '/* TPL_CONDITION=user && user.isAdmin */';

    expect(() => parseInlineReplacements(content)).toThrow(
      'Invalid replacement value "user && user.isAdmin" for TPL_CONDITION',
    );
  });

  it('should throw error for duplicate variable names', () => {
    const content = `
      /* TPL_COMPONENT_NAME=UserEditPage */
      /* TPL_COMPONENT_NAME=AnotherPage */
    `;

    expect(() => parseInlineReplacements(content)).toThrow(
      'Duplicate variable name: TPL_COMPONENT_NAME',
    );
  });

  it('should throw error for duplicate values', () => {
    const content = `
      /* TPL_COMPONENT_NAME=UserEditPage */
      /* TPL_PAGE_NAME=UserEditPage */
    `;

    expect(() => parseInlineReplacements(content)).toThrow(
      'Duplicate replacement value "UserEditPage" for TPL_PAGE_NAME',
    );
  });

  it('should handle empty content', () => {
    const result = parseInlineReplacements('');

    expect(result.replacements).toEqual({});
    expect(result.content).toBe('');
  });

  it('should handle content without replacement comments', () => {
    const content = `
      function Component() {
        return <div>Hello</div>;
      }
    `;

    const result = parseInlineReplacements(content);

    expect(result.replacements).toEqual({});
    expect(result.content).toBe(content);
  });

  it('should remove trailing newlines after comments', () => {
    const content = `import { User } from './types.js';

/* TPL_COMPONENT_NAME=UserEditPage */
/* TPL_USER_TYPE=User */

function UserEditPage() {
  return <div>Hello</div>;
}`;

    const result = parseInlineReplacements(content);

    // Should not have extra blank lines where comments were
    expect(result.content).not.toContain('\n\n\nfunction');
    expect(result.content).toContain('import { User }');
    expect(result.content).toContain('function UserEditPage()');
  });
});

describe('generateInlineReplacementComments', () => {
  it('should generate sorted comments', () => {
    const replacements = {
      UserEditPage: 'TPL_COMPONENT_NAME',
      '/admin/users/$id': 'TPL_ROUTE_PATH',
      updateUser: 'TPL_MUTATION_NAME',
      User: 'TPL_USER_TYPE',
    };

    const comments = generateInlineReplacementComments(replacements);

    expect(comments).toEqual([
      '/* TPL_COMPONENT_NAME=UserEditPage */',
      '/* TPL_MUTATION_NAME=updateUser */',
      '/* TPL_ROUTE_PATH=/admin/users/$id */',
      '/* TPL_USER_TYPE=User */',
    ]);
  });

  it('should handle empty replacements', () => {
    const comments = generateInlineReplacementComments({});
    expect(comments).toEqual([]);
  });
});

describe('isValidInlineReplacementValue', () => {
  it('should accept valid identifier values', () => {
    expect(isValidInlineReplacementValue('UserEditPage')).toBe(true);
    expect(isValidInlineReplacementValue('updateUser')).toBe(true);
    expect(isValidInlineReplacementValue('Component123')).toBe(true);
    expect(isValidInlineReplacementValue('$component')).toBe(true);
    expect(isValidInlineReplacementValue('_privateVar')).toBe(true);
  });

  it('should accept valid path values', () => {
    expect(isValidInlineReplacementValue('/admin/users/$id')).toBe(true);
    expect(isValidInlineReplacementValue('./components/form')).toBe(true);
    expect(isValidInlineReplacementValue('../utils/helpers.js')).toBe(true);
    expect(isValidInlineReplacementValue('/api/v1/users.json')).toBe(true);
  });

  it('should accept kebab-case values', () => {
    expect(isValidInlineReplacementValue('user-edit-form')).toBe(true);
    expect(isValidInlineReplacementValue('admin-dashboard')).toBe(true);
  });

  it('should accept simple numbers and booleans', () => {
    expect(isValidInlineReplacementValue('42')).toBe(true);
    expect(isValidInlineReplacementValue('true')).toBe(true);
    expect(isValidInlineReplacementValue('false')).toBe(true);
  });

  it('should reject invalid characters', () => {
    expect(isValidInlineReplacementValue('data?.user')).toBe(false);
    expect(isValidInlineReplacementValue('user && admin')).toBe(false);
    expect(isValidInlineReplacementValue('"hello world"')).toBe(false);
    expect(isValidInlineReplacementValue("'single quotes'")).toBe(false);
    expect(isValidInlineReplacementValue('`template literal`')).toBe(false);
    expect(isValidInlineReplacementValue('user[0]')).toBe(false);
    expect(isValidInlineReplacementValue('func()')).toBe(false);
    expect(isValidInlineReplacementValue('a + b')).toBe(false);
  });
});
