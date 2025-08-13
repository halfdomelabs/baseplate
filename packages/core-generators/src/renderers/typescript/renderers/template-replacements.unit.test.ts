import { describe, expect, it } from 'vitest';

import { renderTsTemplateToTsCodeFragment } from './template.js';

describe('renderTsTemplateToTsCodeFragment with replacement variables', () => {
  it('should generate inline replacement comments when metadata is included', () => {
    const template = `
import { UserDocument } from './types.js';

export const Route = createFileRoute('TPL_ROUTE_PATH')({
  component: TPL_COMPONENT_NAME,
});

function TPL_COMPONENT_NAME(): ReactElement {
  const [TPL_MUTATION_NAME] = useMutation(TPL_UPDATE_MUTATION);
  const { data } = useQuery(TPL_QUERY_DOCUMENT);
  return <div>{data?.user.email}</div>;
}
`;

    const variables = {
      TPL_ROUTE_PATH: '/admin/accounts/users/$id',
      TPL_COMPONENT_NAME: 'UserEditPage',
      TPL_MUTATION_NAME: 'updateUser',
      TPL_UPDATE_MUTATION: 'UpdateUserDocument',
      TPL_QUERY_DOCUMENT: 'UserEditByIdDocument',
    };

    const variableMetadata = {
      TPL_ROUTE_PATH: { type: 'replacement' as const },
      TPL_COMPONENT_NAME: { type: 'replacement' as const },
      TPL_MUTATION_NAME: { type: 'replacement' as const },
      TPL_UPDATE_MUTATION: { type: 'replacement' as const },
      TPL_QUERY_DOCUMENT: { type: 'replacement' as const },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: true,
      variableMetadata,
    });

    // Should include replacement comments after imports
    expect(result.contents).toContain('/* TPL_COMPONENT_NAME=UserEditPage */');
    expect(result.contents).toContain('/* TPL_MUTATION_NAME=updateUser */');
    expect(result.contents).toContain(
      '/* TPL_QUERY_DOCUMENT=UserEditByIdDocument */',
    );
    expect(result.contents).toContain(
      '/* TPL_ROUTE_PATH=/admin/accounts/users/$id */',
    );
    expect(result.contents).toContain(
      '/* TPL_UPDATE_MUTATION=UpdateUserDocument */',
    );

    // Should still render the actual values
    expect(result.contents).toContain(
      "createFileRoute('/admin/accounts/users/$id')",
    );
    expect(result.contents).toContain('component: UserEditPage');
    expect(result.contents).toContain('function UserEditPage(): ReactElement');
    expect(result.contents).toContain('const [updateUser]');
    expect(result.contents).toContain('useMutation(UpdateUserDocument)');
    expect(result.contents).toContain('useQuery(UserEditByIdDocument)');
  });

  it('should handle mixed replacement and delimited variables', () => {
    const template = `
import { User } from './types.js';

function TPL_COMPONENT_NAME(): ReactElement {
  TPL_COMPLEX_LOGIC;
  
  return <div>Hello</div>;
}
`;

    const variables = {
      TPL_COMPONENT_NAME: 'UserCard',
      TPL_COMPLEX_LOGIC: {
        contents: `const result = processComplexData(data);
  const transformed = transformResult(result);`,
        imports: [],
        hoistedFragments: [],
      },
    };

    const variableMetadata = {
      TPL_COMPONENT_NAME: { type: 'replacement' as const },
      TPL_COMPLEX_LOGIC: { type: 'delimited' as const },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: true,
      variableMetadata,
    });

    // Should include replacement comment for simple variable
    expect(result.contents).toContain('/* TPL_COMPONENT_NAME=UserCard */');

    // Should include delimited markers for complex variable
    expect(result.contents).toContain('/* TPL_COMPLEX_LOGIC:START */');
    expect(result.contents).toContain('/* TPL_COMPLEX_LOGIC:END */');
    expect(result.contents).toContain('processComplexData(data)');
  });

  it('should skip replacement comments for complex values', () => {
    const template = `
function TPL_COMPONENT_NAME(): ReactElement {
  const data = TPL_COMPLEX_EXPR;
  return <div>{data}</div>;
}
`;

    const variables = {
      TPL_COMPONENT_NAME: 'UserCard',
      TPL_COMPLEX_EXPR: 'user?.profile?.email',
    };

    const variableMetadata = {
      TPL_COMPONENT_NAME: { type: 'replacement' as const },
      TPL_COMPLEX_EXPR: { type: 'replacement' as const },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: true,
      variableMetadata,
    });

    // Should include replacement comment for simple value
    expect(result.contents).toContain('/* TPL_COMPONENT_NAME=UserCard */');

    // Should NOT include replacement comment for complex value (since it has special characters)
    expect(result.contents).not.toContain('/* TPL_COMPLEX_EXPR=');

    // Complex value marked as replacement should still be rendered as plain value (no delimiters)
    // since it's marked as replacement type, even though it can't have a replacement comment
    expect(result.contents).toContain('const data = user?.profile?.email');
    expect(result.contents).not.toContain('/* TPL_COMPLEX_EXPR:START */');
  });

  it('should throw error for duplicate replacement values', () => {
    const template = `
function TPL_COMPONENT_NAME(): ReactElement {
  const TPL_VAR_NAME = 'test';
  return <div>Hello</div>;
}
`;

    const variables = {
      TPL_COMPONENT_NAME: 'UserCard',
      TPL_VAR_NAME: 'UserCard', // Same value as component name
    };

    const variableMetadata = {
      TPL_COMPONENT_NAME: { type: 'replacement' as const },
      TPL_VAR_NAME: { type: 'replacement' as const },
    };

    expect(() =>
      renderTsTemplateToTsCodeFragment(template, variables, {
        includeMetadata: true,
        variableMetadata,
      }),
    ).toThrow('Duplicate replacement value "UserCard"');
  });

  it('should throw error if replacement value exists in template', () => {
    const template = `
import { UserEditPage } from './components.js';

function TPL_COMPONENT_NAME(): ReactElement {
  return <UserEditPage />;
}
`;

    const variables = {
      TPL_COMPONENT_NAME: 'UserEditPage', // This value already exists in template
    };

    const variableMetadata = {
      TPL_COMPONENT_NAME: { type: 'replacement' as const },
    };

    expect(() =>
      renderTsTemplateToTsCodeFragment(template, variables, {
        includeMetadata: true,
        variableMetadata,
      }),
    ).toThrow('template contents contain the value "UserEditPage"');
  });

  it('should not generate replacement comments when metadata is false', () => {
    const template = `
function TPL_COMPONENT_NAME(): ReactElement {
  return <div>Hello</div>;
}
`;

    const variables = {
      TPL_COMPONENT_NAME: 'UserCard',
    };

    const variableMetadata = {
      TPL_COMPONENT_NAME: { type: 'replacement' as const },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: false,
      variableMetadata,
    });

    // Should NOT include replacement comment
    expect(result.contents).not.toContain('/* TPL_COMPONENT_NAME=UserCard */');

    // Should still render the value
    expect(result.contents).toContain('function UserCard(): ReactElement');
  });

  it('should handle templates with no imports', () => {
    const template = `
function TPL_COMPONENT_NAME(): ReactElement {
  return <div>Hello</div>;
}
`;

    const variables = {
      TPL_COMPONENT_NAME: 'UserCard',
    };

    const variableMetadata = {
      TPL_COMPONENT_NAME: { type: 'replacement' as const },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: true,
      variableMetadata,
    });

    // Should add replacement comments at the beginning
    expect(result.contents.trim()).toMatch(
      /^\/\* TPL_COMPONENT_NAME=UserCard \*\//,
    );
  });

  it('should sort replacement comments alphabetically', () => {
    const template = `
import { User } from './types.js';

const component = TPL_COMPONENT_NAME;
const mutation = TPL_MUTATION_NAME;
const route = TPL_ROUTE_PATH;
`;

    const variables = {
      TPL_ROUTE_PATH: '/admin/users',
      TPL_COMPONENT_NAME: 'UserList',
      TPL_MUTATION_NAME: 'createUser',
    };

    const variableMetadata = {
      TPL_ROUTE_PATH: { type: 'replacement' as const },
      TPL_COMPONENT_NAME: { type: 'replacement' as const },
      TPL_MUTATION_NAME: { type: 'replacement' as const },
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: true,
      variableMetadata,
    });

    // Extract the replacement comments section
    const lines = result.contents.split('\n');
    const replacementLines = lines.filter((line) => line.includes('/* TPL_'));

    // Should be sorted alphabetically by variable name
    expect(replacementLines[0]).toContain('TPL_COMPONENT_NAME=UserList');
    expect(replacementLines[1]).toContain('TPL_MUTATION_NAME=createUser');
    expect(replacementLines[2]).toContain('TPL_ROUTE_PATH=/admin/users');
  });

  it('should handle empty variables gracefully', () => {
    const template = `
function Component(): ReactElement {
  return <div>Hello</div>;
}
`;

    const variables = {};
    const variableMetadata = {};

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: true,
      variableMetadata,
    });

    // Should not add any replacement comments
    expect(result.contents).not.toContain('/* TPL_');
  });

  it('should only process variables marked as replacement type', () => {
    const template = `
function TPL_COMPONENT_NAME(): ReactElement {
  const mutation = TPL_MUTATION_NAME;
  return <div>Hello</div>;
}
`;

    const variables = {
      TPL_COMPONENT_NAME: 'UserCard',
      TPL_MUTATION_NAME: 'updateUser',
    };

    const variableMetadata = {
      TPL_COMPONENT_NAME: { type: 'replacement' as const },
      TPL_MUTATION_NAME: {}, // No type specified, should not be treated as replacement
    };

    const result = renderTsTemplateToTsCodeFragment(template, variables, {
      includeMetadata: true,
      variableMetadata,
    });

    // Should only include replacement comment for the one marked as replacement
    expect(result.contents).toContain('/* TPL_COMPONENT_NAME=UserCard */');
    expect(result.contents).not.toContain('/* TPL_MUTATION_NAME=');

    // But both should still be rendered with their values
    expect(result.contents).toContain('function UserCard()');
    expect(result.contents).toContain('/* TPL_MUTATION_NAME:START */');
  });
});
