import { describe, expect, it } from 'vitest';

import { applySimpleReplacements } from './apply-simple-replacements.js';

describe('applySimpleReplacements', () => {
  it('should replace identifiers with word boundaries', () => {
    const content = `
      function UserEditPage(): ReactElement {
        const user = new User();
        const currentUser = getCurrentUser();
        return <UserProfile user={user} />;
      }
    `;

    const replacements = {
      UserEditPage: 'TPL_COMPONENT_NAME',
      User: 'TPL_USER_CLASS',
    };

    const result = applySimpleReplacements(content, replacements);

    expect(result).toContain('function TPL_COMPONENT_NAME(): ReactElement');
    expect(result).toContain('const user = new TPL_USER_CLASS()');
    // Should NOT replace "User" in "currentUser" or "UserProfile"
    expect(result).toContain('currentUser');
    expect(result).toContain('UserProfile');
  });

  it('should replace string literals within quotes', () => {
    const content = `
      const route = '/admin/accounts/users/$id';
      const path = "/admin/accounts/users/$id";
      const template = \`/admin/accounts/users/$id\`;
    `;

    const replacements = {
      '/admin/accounts/users/$id': 'TPL_ROUTE_PATH',
    };

    const result = applySimpleReplacements(content, replacements);

    expect(result).toContain("const route = 'TPL_ROUTE_PATH'");
    expect(result).toContain('const path = "TPL_ROUTE_PATH"');
    expect(result).toContain('const template = `TPL_ROUTE_PATH`');
  });

  it('should not update import statements', () => {
    const content = `
      import { UserDocument } from './user-document.ts';
import type { UserName } from './user-name.ts';

      console.log(UserDocument);
    `;

    const replacements = {
      UserDocument: 'TPL_QUERY_DOCUMENT',
      UserName: 'TPL_USER_NAME',
    };

    const result = applySimpleReplacements(content, replacements);

    // Should replace the longer matches first
    expect(result).toContain(
      "import { UserDocument } from './user-document.ts';",
    );
    expect(result).toContain("import type { UserName } from './user-name.ts';");
    expect(result).toContain('console.log(TPL_QUERY_DOCUMENT);');
  });

  it('should handle replacements in correct order (longest first)', () => {
    const content = `
      console.log(UserDocument, UpdateUserDocument);
    `;

    const replacements = {
      User: 'TPL_ENTITY',
      UpdateUserDocument: 'TPL_UPDATE_MUTATION',
      UserDocument: 'TPL_QUERY_DOCUMENT',
    };

    const result = applySimpleReplacements(content, replacements);

    // Should replace the longer matches first
    expect(result).toContain('TPL_UPDATE_MUTATION');
    expect(result).toContain('TPL_QUERY_DOCUMENT');
    // Should not have replaced "User" within the longer identifiers
    expect(result).not.toContain('UpdateTPL_ENTITYDocument');
  });

  it('should handle JSX components correctly', () => {
    const content = `
      function App() {
        return <UserEditForm onSubmit={updateUser} />;
      }
    `;

    const replacements = {
      UserEditForm: 'TPL_FORM_COMPONENT',
      updateUser: 'TPL_MUTATION_NAME',
    };

    const result = applySimpleReplacements(content, replacements);

    expect(result).toContain('<TPL_FORM_COMPONENT');
    expect(result).toContain('onSubmit={TPL_MUTATION_NAME}');
  });

  it('should handle function calls and method names', () => {
    const content = `
      const [updateUser] = useMutation(UpdateUserDocument);
      await updateUser({ variables: { id, data } });
    `;

    const replacements = {
      updateUser: 'TPL_MUTATION_NAME',
      UpdateUserDocument: 'TPL_UPDATE_MUTATION',
    };

    const result = applySimpleReplacements(content, replacements);

    expect(result).toContain('const [TPL_MUTATION_NAME]');
    expect(result).toContain('useMutation(TPL_UPDATE_MUTATION)');
    expect(result).toContain('await TPL_MUTATION_NAME({');
  });

  it('should validate TPL_ prefix', () => {
    const content = 'const user = new User();';

    const replacements = {
      User: 'INVALID_VARIABLE', // Missing TPL_ prefix
    };

    expect(() => applySimpleReplacements(content, replacements)).toThrow(
      'Template variable must start with TPL_',
    );
  });

  it('should handle empty replacements', () => {
    const content = 'const user = new User();';
    const replacements = {};

    const result = applySimpleReplacements(content, replacements);

    expect(result).toBe(content);
  });

  it('should handle complex real-world example', () => {
    const content = `
      import { UserEditByIdDocument, UpdateUserDocument } from '@src/generated/graphql';
      
      export const Route = createFileRoute('/admin/accounts/users/$id')({
        component: UserEditPage,
      });
      
      function UserEditPage(): ReactElement {
        const [updateUser] = useMutation(UpdateUserDocument);
        const { data } = useQuery(UserEditByIdDocument);
        
        const submitData = async (formData: UserFormData): Promise<void> => {
          await updateUser({ variables: { input: { id, data: formData } } });
        };
        
        return <UserEditForm onSubmit={submitData} />;
      }
    `;

    const replacements = {
      UserEditPage: 'TPL_COMPONENT_NAME',
      UserEditByIdDocument: 'TPL_QUERY_DOCUMENT',
      UpdateUserDocument: 'TPL_UPDATE_MUTATION',
      updateUser: 'TPL_MUTATION_NAME',
      '/admin/accounts/users/$id': 'TPL_ROUTE_PATH',
      UserFormData: 'TPL_FORM_DATA_NAME',
      UserEditForm: 'TPL_EDIT_FORM',
    };

    const result = applySimpleReplacements(content, replacements);

    expect(result).toContain(
      'import { UserEditByIdDocument, UpdateUserDocument }',
    );
    expect(result).toContain("createFileRoute('TPL_ROUTE_PATH')");
    expect(result).toContain('component: TPL_COMPONENT_NAME');
    expect(result).toContain('function TPL_COMPONENT_NAME(): ReactElement');
    expect(result).toContain(
      'const [TPL_MUTATION_NAME] = useMutation(TPL_UPDATE_MUTATION)',
    );
    expect(result).toContain('useQuery(TPL_QUERY_DOCUMENT)');
    expect(result).toContain('(formData: TPL_FORM_DATA_NAME)');
    expect(result).toContain('await TPL_MUTATION_NAME({');
    expect(result).toContain('<TPL_EDIT_FORM');
  });

  it('should handle type annotations correctly', () => {
    const content = `
      interface Props {
        user: User;
        users: User[];
      }
      
      const data: UserData = {};
      let result: UpdateUserResult;
    `;

    const replacements = {
      User: 'TPL_USER_TYPE',
      UserData: 'TPL_USER_DATA_TYPE',
      UpdateUserResult: 'TPL_UPDATE_RESULT_TYPE',
    };

    const result = applySimpleReplacements(content, replacements);

    expect(result).toContain('user: TPL_USER_TYPE;');
    expect(result).toContain('users: TPL_USER_TYPE[];');
    expect(result).toContain('const data: TPL_USER_DATA_TYPE');
    expect(result).toContain('let result: TPL_UPDATE_RESULT_TYPE');
  });
});
