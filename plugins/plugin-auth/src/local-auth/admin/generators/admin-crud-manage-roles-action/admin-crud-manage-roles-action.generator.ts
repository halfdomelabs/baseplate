import type { GraphQLFragment } from '@baseplate-dev/react-generators/dist/writers/graphql/graphql.js';

import {
  tsImportBuilder,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import {
  adminCrudActionContainerProvider,
  graphqlImportsProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  order: z.int().nonnegative(),
  position: z.enum(['inline', 'dropdown']).default('dropdown'),
  availableRoles: z.array(
    z.object({
      name: z.string(),
      comment: z.string(),
    }),
  ),
});

export const adminCrudManageRolesActionGenerator = createGenerator({
  name: 'local-auth/admin/admin-crud-manage-roles-action',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: () => 'manage-roles',
  buildTasks: ({ order, position, availableRoles }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        adminCrudActionContainer: adminCrudActionContainerProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        renderers: GENERATED_TEMPLATES.renderers.provider,
        paths: GENERATED_TEMPLATES.paths.provider,
        graphqlImports: graphqlImportsProvider,
      },
      run({
        adminCrudActionContainer,
        reactComponentsImports,
        renderers,
        paths,
        graphqlImports,
      }) {
        // Create the action fragment based on position
        const actionFragment =
          position === 'inline'
            ? tsTemplateWithImports([
                reactComponentsImports.Button.declaration(),
                tsImportBuilder(['MdSecurity']).from('react-icons/md'),
              ])`
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setRoleDialogUser(item);
              }}
            >
              <MdSecurity />
              <span className="sr-only">Manage Roles</span>
            </Button>
          `
            : tsTemplateWithImports([
                reactComponentsImports.DropdownMenuItem.declaration(),
                tsImportBuilder(['MdSecurity']).from('react-icons/md'),
              ])`
          <DropdownMenuItem
            onClick={() => {
              setRoleDialogUser(item);
            }}
          >
            <MdSecurity className="mr-2 h-4 w-4" />
            Manage Roles
          </DropdownMenuItem>
        `;

        // Hook content for managing the role dialog state
        const hookContent = tsTemplateWithImports([
          tsImportBuilder(['useState']).from('react'),
          graphqlImports.FragmentOf.typeDeclaration(),
          tsImportBuilder(['roleManagerDialogUserFragment']).from(
            paths.roleManagerDialog,
          ),
        ])`
          const [roleDialogUser, setRoleDialogUser] = useState<FragmentOf<typeof roleManagerDialogUserFragment> | null>(
            null,
          );
        `;

        // Sibling component for the role manager dialog
        const siblingContent = tsTemplateWithImports([
          tsImportBuilder(['RoleManagerDialog']).from(paths.roleManagerDialog),
        ])`
          {roleDialogUser && (
            <RoleManagerDialog
              user={roleDialogUser}
              open={!!roleDialogUser}
              onOpenChange={(open) => {
                if (!open) setRoleDialogUser(null);
              }}
            />
          )}
        `;

        const roleManagerDialogUserFragment: GraphQLFragment = {
          variableName: 'roleManagerDialogUserFragment',
          fragmentName: 'RoleManagerDialog_user',
          onType: 'User',
          fields: [],
          path: paths.roleManagerDialog,
        };

        // Add the action to the container
        adminCrudActionContainer.addAction({
          name: 'Manage Roles',
          type: 'manage-roles',
          position,
          order,
          action: actionFragment,
          hookContent,
          siblingContent,
          graphQLFields: [
            {
              type: 'spread',
              fragment: roleManagerDialogUserFragment,
            },
          ],
        });

        return {
          build: async (builder) => {
            await builder.apply(
              renderers.roleManagerDialog.render({
                variables: {
                  TPL_AVAILABLE_ROLES: JSON.stringify(
                    availableRoles.map((role) => ({
                      value: role.name,
                      label: role.name,
                      description: role.comment,
                    })),
                  ),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
