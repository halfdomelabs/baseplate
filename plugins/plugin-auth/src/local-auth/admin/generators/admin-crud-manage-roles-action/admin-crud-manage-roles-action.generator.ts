import {
  tsImportBuilder,
  tsTemplateWithImports,
} from '@baseplate-dev/core-generators';
import {
  adminCrudActionContainerProvider,
  adminCrudQueriesProvider,
  reactComponentsImportsProvider,
} from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { LOCAL_AUTH_ADMIN_ADMIN_CRUD_MANAGE_ROLES_ACTION_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  order: z.number().int().nonnegative(),
  position: z.enum(['inline', 'dropdown']).default('dropdown'),
  userModelName: z.string().min(1),
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
  buildTasks: ({ order, position, userModelName, availableRoles }) => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        adminCrudActionContainer: adminCrudActionContainerProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        renderers: GENERATED_TEMPLATES.renderers.provider,
        paths: GENERATED_TEMPLATES.paths.provider,
        adminCrudQueries: adminCrudQueriesProvider,
      },
      run({
        adminCrudActionContainer,
        reactComponentsImports,
        renderers,
        adminCrudQueries,
        paths,
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
        ])`
          const [roleDialogUser, setRoleDialogUser] = useState<${adminCrudQueries.getRowFragmentExpression()} | null>(
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
              name: 'roles',
              fields: [{ name: 'role' }],
            },
            { name: 'name' },
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
              renderers.roleManagerDialogGql.render({
                variables: {
                  TPL_USER_ROW_FRAGMENT: `${userModelName}Row`,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
