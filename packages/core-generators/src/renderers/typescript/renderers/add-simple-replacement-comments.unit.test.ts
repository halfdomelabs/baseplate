import { describe, expect, it } from 'vitest';

import { addSimpleReplacementComments } from './template.js';

describe('addSimpleReplacementComments', () => {
  it('should return template unchanged when metadata is not enabled', () => {
    const template = 'const x = 5;';
    const renderedTemplate = 'const x = 5;';
    const variables = { TPL_VAR: 'value' };
    const options = {
      includeMetadata: false,
      variableMetadata: {
        TPL_VAR: { type: 'replacement' as const },
      },
    };

    const result = addSimpleReplacementComments(
      template,
      renderedTemplate,
      variables,
      options,
    );

    expect(result).toBe(renderedTemplate);
  });

  it('should return template unchanged when no variable metadata provided', () => {
    const template = 'const x = 5;';
    const renderedTemplate = 'const x = 5;';
    const variables = { TPL_VAR: 'value' };
    const options = {
      includeMetadata: true,
    };

    const result = addSimpleReplacementComments(
      template,
      renderedTemplate,
      variables,
      options,
    );

    expect(result).toBe(renderedTemplate);
  });

  it('should add replacement comments after imports', () => {
    const template = `
import { User } from './types.js';

const name = TPL_USER_NAME;
`;
    const renderedTemplate = `
import { User } from './types.js';

const name = 'John';
`;
    const variables = { TPL_USER_NAME: 'John' };
    const options = {
      includeMetadata: true,
      variableMetadata: {
        TPL_USER_NAME: { type: 'replacement' as const },
      },
    };

    const result = addSimpleReplacementComments(
      template,
      renderedTemplate,
      variables,
      options,
    );

    expect(result).toContain('import { User }');
    expect(result).toContain('/* TPL_USER_NAME=John */');
    expect(result).toContain('const name = ');
  });

  it('should add replacement comments at beginning when no imports', () => {
    const template = 'const name = TPL_USER_NAME;';
    const renderedTemplate = 'const name = "John";';
    const variables = { TPL_USER_NAME: 'John' };
    const options = {
      includeMetadata: true,
      variableMetadata: {
        TPL_USER_NAME: { type: 'replacement' as const },
      },
    };

    const result = addSimpleReplacementComments(
      template,
      renderedTemplate,
      variables,
      options,
    );

    expect(result.trim()).toMatch(/^\/\* TPL_USER_NAME=John \*\//);
  });

  it('should ignore complex values that cannot be replacements', () => {
    const template = 'const expr = TPL_COMPLEX;';
    const renderedTemplate = 'const expr = user?.profile?.email;';
    const variables = { TPL_COMPLEX: 'user?.profile?.email' };
    const options = {
      includeMetadata: true,
      variableMetadata: {
        TPL_COMPLEX: { type: 'replacement' as const },
      },
    };

    const result = addSimpleReplacementComments(
      template,
      renderedTemplate,
      variables,
      options,
    );

    expect(result).toBe(renderedTemplate);
    expect(result).not.toContain('/* TPL_COMPLEX=');
  });

  it('should only process variables marked as replacement type', () => {
    const template = `
const a = TPL_VAR_A;
const b = TPL_VAR_B;
`;
    const renderedTemplate = `
const a = valueA;
const b = valueB;
`;
    const variables = {
      TPL_VAR_A: 'valueA',
      TPL_VAR_B: 'valueB',
    };
    const options = {
      includeMetadata: true,
      variableMetadata: {
        TPL_VAR_A: { type: 'replacement' as const },
        TPL_VAR_B: { type: 'delimited' as const },
      },
    };

    const result = addSimpleReplacementComments(
      template,
      renderedTemplate,
      variables,
      options,
    );

    expect(result).toContain('/* TPL_VAR_A=valueA */');
    expect(result).not.toContain('/* TPL_VAR_B=');
  });

  it('should throw error for duplicate replacement values', () => {
    const template = `
const a = TPL_VAR_A;
const b = TPL_VAR_B;
`;
    const renderedTemplate = `
const a = sameValue;
const b = sameValue;
`;
    const variables = {
      TPL_VAR_A: 'sameValue',
      TPL_VAR_B: 'sameValue',
    };
    const options = {
      includeMetadata: true,
      variableMetadata: {
        TPL_VAR_A: { type: 'replacement' as const },
        TPL_VAR_B: { type: 'replacement' as const },
      },
    };

    expect(() =>
      addSimpleReplacementComments(
        template,
        renderedTemplate,
        variables,
        options,
      ),
    ).toThrow('Duplicate replacement value "sameValue"');
  });

  it('should throw error if replacement value exists in original template', () => {
    const template = `
import { UserEditPage } from './components.js';

function TPL_COMPONENT(): ReactElement {
  return <UserEditPage />;
}
`;
    const renderedTemplate = `
import { UserEditPage } from './components.js';

function UserEditPage(): ReactElement {
  return <UserEditPage />;
}
`;
    const variables = {
      TPL_COMPONENT: 'UserEditPage',
    };
    const options = {
      includeMetadata: true,
      variableMetadata: {
        TPL_COMPONENT: { type: 'replacement' as const },
      },
    };

    expect(() =>
      addSimpleReplacementComments(
        template,
        renderedTemplate,
        variables,
        options,
      ),
    ).toThrow('template contents contain the value "UserEditPage"');
  });

  it('should handle code fragments with imports and hoisted fragments', () => {
    const template = `
function TPL_COMPONENT_NAME() {
  return <div>Hello</div>;
}
`;
    const renderedTemplate = `
function UserCard() {
  return <div>Hello</div>;
}
`;
    const variables = {
      TPL_COMPONENT_NAME: {
        contents: 'UserCard',
        imports: [],
        hoistedFragments: [],
      },
    };
    const options = {
      includeMetadata: true,
      variableMetadata: {
        TPL_COMPONENT_NAME: { type: 'replacement' as const },
      },
    };

    const result = addSimpleReplacementComments(
      template,
      renderedTemplate,
      variables,
      options,
    );

    expect(result).toContain('/* TPL_COMPONENT_NAME=UserCard */');
  });

  it('should sort replacement comments alphabetically', () => {
    const template = `
const c = TPL_C;
const a = TPL_A;
const b = TPL_B;
`;
    const renderedTemplate = `
const c = valueC;
const a = valueA;
const b = valueB;
`;
    const variables = {
      TPL_C: 'valueC',
      TPL_A: 'valueA',
      TPL_B: 'valueB',
    };
    const options = {
      includeMetadata: true,
      variableMetadata: {
        TPL_C: { type: 'replacement' as const },
        TPL_A: { type: 'replacement' as const },
        TPL_B: { type: 'replacement' as const },
      },
    };

    const result = addSimpleReplacementComments(
      template,
      renderedTemplate,
      variables,
      options,
    );

    const lines = result.split('\n');
    const commentLines = lines.filter((line) => line.includes('/* TPL_'));

    expect(commentLines[0]).toContain('TPL_A=valueA');
    expect(commentLines[1]).toContain('TPL_B=valueB');
    expect(commentLines[2]).toContain('TPL_C=valueC');
  });
});
