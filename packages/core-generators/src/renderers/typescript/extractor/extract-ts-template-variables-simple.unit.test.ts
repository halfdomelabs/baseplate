import { describe, expect, it } from 'vitest';

import { extractTsTemplateVariables } from './extract-ts-template-variables.js';

describe('extractTsTemplateVariables with simple replacements', () => {
  it('should extract both simple and delimiter-based variables', () => {
    const content = `
      // @ts-nocheck
      
      import { UserEditByIdDocument, UpdateUserDocument } from '%generatedGraphqlImports';
      import { useMutation } from '@apollo/client';
      
      /* TPL_COMPONENT_NAME=UserEditPage */
      /* TPL_MUTATION_NAME=updateUser */
      /* TPL_QUERY_DOCUMENT=UserEditByIdDocument */
      /* TPL_ROUTE_PATH=/admin/accounts/users/$id */
      /* TPL_UPDATE_MUTATION=UpdateUserDocument */
      
      export const Route = createFileRoute('/admin/accounts/users/$id')({
        component: UserEditPage,
      });
      
      function UserEditPage(): ReactElement {
        const [updateUser] = useMutation(UpdateUserDocument);
        const { data } = useQuery(UserEditByIdDocument);
        
        /* TPL_DATA_LOADER:START */
        // Some other data loading logic
        const loading = true;
        /* TPL_DATA_LOADER:END */
        
        return <div>{data?.user.email}</div>;
      }
    `;

    const result = extractTsTemplateVariables(content);

    // Check that simple replacement variables are tracked
    expect(result.variables).toHaveProperty('TPL_COMPONENT_NAME');
    expect(result.variables).toHaveProperty('TPL_MUTATION_NAME');
    expect(result.variables).toHaveProperty('TPL_QUERY_DOCUMENT');
    expect(result.variables).toHaveProperty('TPL_ROUTE_PATH');
    expect(result.variables).toHaveProperty('TPL_UPDATE_MUTATION');

    // Check that delimiter-based variables are still tracked
    expect(result.variables).toHaveProperty('TPL_DATA_LOADER');

    // Check that content has been processed
    expect(result.content).toContain('TPL_COMPONENT_NAME');
    expect(result.content).toContain('TPL_MUTATION_NAME');
    expect(result.content).toContain('TPL_QUERY_DOCUMENT');
    expect(result.content).toContain('TPL_ROUTE_PATH');
    expect(result.content).toContain('TPL_UPDATE_MUTATION');
    expect(result.content).toContain('TPL_DATA_LOADER');

    // Simple replacement comments should be removed
    expect(result.content).not.toContain(
      '/* TPL_COMPONENT_NAME=UserEditPage */',
    );
    expect(result.content).not.toContain('/* TPL_MUTATION_NAME=updateUser */');

    // Delimiter comments should be collapsed to variable names
    expect(result.content).not.toContain('/* TPL_DATA_LOADER:START */');
    expect(result.content).not.toContain('/* TPL_DATA_LOADER:END */');
  });

  it('should work with only simple replacements', () => {
    const content = `
      import { User } from './types.js';
      
      /* TPL_COMPONENT_NAME=UserCard */
      /* TPL_USER_TYPE=User */
      
      function UserCard(user: User): ReactElement {
        return <div>{user.name}</div>;
      }
    `;

    const result = extractTsTemplateVariables(content);

    expect(result.variables).toHaveProperty('TPL_COMPONENT_NAME');
    expect(result.variables).toHaveProperty('TPL_USER_TYPE');

    expect(result.content).toContain('TPL_COMPONENT_NAME');
    expect(result.content).toContain('TPL_USER_TYPE');
    expect(result.content).not.toContain('/* TPL_COMPONENT_NAME=UserCard */');
  });

  it('should work with only delimiter-based variables (backward compatibility)', () => {
    const content = `
      function /* TPL_COMPONENT_NAME:START */UserEditPage/* TPL_COMPONENT_NAME:END */(): ReactElement {
        const [/* TPL_MUTATION_NAME:START */updateUser/* TPL_MUTATION_NAME:END */] = useMutation();
        return <div>Test</div>;
      }
    `;

    const result = extractTsTemplateVariables(content);

    expect(result.variables).toHaveProperty('TPL_COMPONENT_NAME');
    expect(result.variables).toHaveProperty('TPL_MUTATION_NAME');

    expect(result.content).toContain('TPL_COMPONENT_NAME');
    expect(result.content).toContain('TPL_MUTATION_NAME');
  });

  it('should handle mixed replacement patterns correctly', () => {
    const content = `
      /* TPL_COMPONENT_NAME=UserEditPage */
      
      function UserEditPage(): ReactElement {
        /* TPL_COMPLEX_LOGIC:START */
        const result = processComplexData(data);
        const transformed = transformResult(result);
        /* TPL_COMPLEX_LOGIC:END */
        
        return <div>Hello</div>;
      }
    `;

    const result = extractTsTemplateVariables(content);

    // Both types should be tracked
    expect(result.variables).toHaveProperty('TPL_COMPONENT_NAME');
    expect(result.variables).toHaveProperty('TPL_COMPLEX_LOGIC');

    // Simple replacement should be applied
    expect(result.content).toContain('function TPL_COMPONENT_NAME()');

    // Complex logic should be collapsed
    expect(result.content).toContain('TPL_COMPLEX_LOGIC');
    expect(result.content).not.toContain('processComplexData');
  });

  it('should preserve imports and other code structure', () => {
    const content = `
      // @ts-nocheck
      
      import { UserDocument } from './types.js';
      import { useMutation } from '@apollo/client';
      
      /* TPL_COMPONENT_NAME=UserEditPage */
      
      export default function UserEditPage() {
        return <div>Hello</div>;
      }
    `;

    const result = extractTsTemplateVariables(content);

    // Imports should be preserved
    expect(result.content).toContain('import { UserDocument }');
    expect(result.content).toContain('import { useMutation }');

    // ts-nocheck should be preserved
    expect(result.content).toContain('// @ts-nocheck');

    // Export structure should be preserved
    expect(result.content).toContain(
      'export default function TPL_COMPONENT_NAME()',
    );

    // Replacement comment should be removed
    expect(result.content).not.toContain(
      '/* TPL_COMPONENT_NAME=UserEditPage */',
    );
  });

  it('should handle edge cases gracefully', () => {
    // Empty content
    expect(() => extractTsTemplateVariables('')).not.toThrow();

    // Only whitespace
    expect(() =>
      extractTsTemplateVariables(String.raw`   \n\n  `),
    ).not.toThrow();

    // Only comments
    const onlyComments = '/* TPL_VAR=value */';
    const result = extractTsTemplateVariables(onlyComments);
    expect(result.variables).toHaveProperty('TPL_VAR');
  });

  it('should validate simple replacement values', () => {
    const invalidContent = `
      /* TPL_COMPLEX_EXPR=data?.user?.email */
      function Component() {}
    `;

    expect(() => extractTsTemplateVariables(invalidContent)).toThrow(
      'Invalid replacement value "data?.user?.email"',
    );
  });
});
