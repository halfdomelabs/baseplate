import { describe, expect, it } from 'vitest';

import {
  generateSimpleReplacementComments,
  isValidSimpleReplacementValue,
  parseSimpleReplacements,
} from './parse-simple-replacements.js';

describe('parseSimpleReplacements', () => {
  it('should parse basic simple replacement comments', () => {
    const content = `
      import { UserDocument } from './types.js';
      
      /* TPL_COMPONENT_NAME=UserEditPage */
      /* TPL_ROUTE_PATH=/admin/users/$id */
      /* TPL_USER_TYPE=User */
      
      function UserEditPage() {
        return <div>Hello</div>;
      }
    `;

    const result = parseSimpleReplacements(content);

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

    const result = parseSimpleReplacements(content);

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

    expect(() => parseSimpleReplacements(content)).toThrow(
      'Invalid replacement value "data?.user?.email" for TPL_COMPLEX_EXPR',
    );
  });

  it('should throw error for values with quotes', () => {
    const content = '/* TPL_STRING_VALUE="hello world" */';

    expect(() => parseSimpleReplacements(content)).toThrow(
      'Invalid replacement value ""hello world"" for TPL_STRING_VALUE',
    );
  });

  it('should throw error for values with special operators', () => {
    const content = '/* TPL_CONDITION=user && user.isAdmin */';

    expect(() => parseSimpleReplacements(content)).toThrow(
      'Invalid replacement value "user && user.isAdmin" for TPL_CONDITION',
    );
  });

  it('should throw error for duplicate variable names', () => {
    const content = `
      /* TPL_COMPONENT_NAME=UserEditPage */
      /* TPL_COMPONENT_NAME=AnotherPage */
    `;

    expect(() => parseSimpleReplacements(content)).toThrow(
      'Duplicate variable name: TPL_COMPONENT_NAME',
    );
  });

  it('should throw error for duplicate values', () => {
    const content = `
      /* TPL_COMPONENT_NAME=UserEditPage */
      /* TPL_PAGE_NAME=UserEditPage */
    `;

    expect(() => parseSimpleReplacements(content)).toThrow(
      'Duplicate replacement value "UserEditPage" for TPL_PAGE_NAME',
    );
  });

  it('should handle empty content', () => {
    const result = parseSimpleReplacements('');

    expect(result.replacements).toEqual({});
    expect(result.content).toBe('');
  });

  it('should handle content without replacement comments', () => {
    const content = `
      function Component() {
        return <div>Hello</div>;
      }
    `;

    const result = parseSimpleReplacements(content);

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

    const result = parseSimpleReplacements(content);

    // Should not have extra blank lines where comments were
    expect(result.content).not.toContain('\n\n\nfunction');
    expect(result.content).toContain('import { User }');
    expect(result.content).toContain('function UserEditPage()');
  });
});

describe('generateSimpleReplacementComments', () => {
  it('should generate sorted comments', () => {
    const replacements = {
      UserEditPage: 'TPL_COMPONENT_NAME',
      '/admin/users/$id': 'TPL_ROUTE_PATH',
      updateUser: 'TPL_MUTATION_NAME',
      User: 'TPL_USER_TYPE',
    };

    const comments = generateSimpleReplacementComments(replacements);

    expect(comments).toEqual([
      '/* TPL_COMPONENT_NAME=UserEditPage */',
      '/* TPL_MUTATION_NAME=updateUser */',
      '/* TPL_ROUTE_PATH=/admin/users/$id */',
      '/* TPL_USER_TYPE=User */',
    ]);
  });

  it('should handle empty replacements', () => {
    const comments = generateSimpleReplacementComments({});
    expect(comments).toEqual([]);
  });
});

describe('isValidSimpleReplacementValue', () => {
  it('should accept valid identifier values', () => {
    expect(isValidSimpleReplacementValue('UserEditPage')).toBe(true);
    expect(isValidSimpleReplacementValue('updateUser')).toBe(true);
    expect(isValidSimpleReplacementValue('Component123')).toBe(true);
    expect(isValidSimpleReplacementValue('$component')).toBe(true);
    expect(isValidSimpleReplacementValue('_privateVar')).toBe(true);
  });

  it('should accept valid path values', () => {
    expect(isValidSimpleReplacementValue('/admin/users/$id')).toBe(true);
    expect(isValidSimpleReplacementValue('./components/form')).toBe(true);
    expect(isValidSimpleReplacementValue('../utils/helpers.js')).toBe(true);
    expect(isValidSimpleReplacementValue('/api/v1/users.json')).toBe(true);
  });

  it('should accept kebab-case values', () => {
    expect(isValidSimpleReplacementValue('user-edit-form')).toBe(true);
    expect(isValidSimpleReplacementValue('admin-dashboard')).toBe(true);
  });

  it('should accept simple numbers and booleans', () => {
    expect(isValidSimpleReplacementValue('42')).toBe(true);
    expect(isValidSimpleReplacementValue('true')).toBe(true);
    expect(isValidSimpleReplacementValue('false')).toBe(true);
  });

  it('should reject invalid characters', () => {
    expect(isValidSimpleReplacementValue('data?.user')).toBe(false);
    expect(isValidSimpleReplacementValue('user && admin')).toBe(false);
    expect(isValidSimpleReplacementValue('"hello world"')).toBe(false);
    expect(isValidSimpleReplacementValue("'single quotes'")).toBe(false);
    expect(isValidSimpleReplacementValue('`template literal`')).toBe(false);
    expect(isValidSimpleReplacementValue('user[0]')).toBe(false);
    expect(isValidSimpleReplacementValue('func()')).toBe(false);
    expect(isValidSimpleReplacementValue('a + b')).toBe(false);
  });
});
