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

import { LOCAL_AUTH_ADMIN_ADMIN_CRUD_RESET_PASSWORD_ACTION_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  order: z.number().int().nonnegative(),
  position: z.enum(['inline', 'dropdown']).default('dropdown'),
  userModelName: z.string().min(1),
});

/**
 * Generator for local-auth/admin/admin-crud-reset-password-action
 */
export const adminCrudResetPasswordActionGenerator = createGenerator({
  name: 'local-auth/admin/admin-crud-reset-password-action',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: () => 'reset-password',
  buildTasks: ({ order, position, userModelName }) => ({
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
                tsImportBuilder(['MdKey']).from('react-icons/md'),
              ])`
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setPasswordResetUser(item);
              }}
            >
              <MdKey />
              <span className="sr-only">Reset Password</span>
            </Button>
          `
            : tsTemplateWithImports([
                reactComponentsImports.DropdownMenuItem.declaration(),
                tsImportBuilder(['MdKey']).from('react-icons/md'),
              ])`
          <DropdownMenuItem
            onClick={() => {
              setPasswordResetUser(item);
            }}
          >
            <MdKey className="mr-2 h-4 w-4" />
            Reset Password
          </DropdownMenuItem>
        `;

        // Hook content for managing the password reset dialog state
        const hookContent = tsTemplateWithImports([
          tsImportBuilder(['useState']).from('react'),
        ])`
          const [passwordResetUser, setPasswordResetUser] = useState<${adminCrudQueries.getRowFragmentExpression()} | null>(
            null,
          );
        `;

        // Sibling component for the password reset dialog
        const siblingContent = tsTemplateWithImports([
          tsImportBuilder(['PasswordResetDialog']).from(
            paths.passwordResetDialog,
          ),
        ])`
          {passwordResetUser && (
            <PasswordResetDialog
              user={passwordResetUser}
              open={!!passwordResetUser}
              onOpenChange={(open) => {
                if (!open) setPasswordResetUser(null);
              }}
            />
          )}
        `;

        // Add the action to the container
        adminCrudActionContainer.addAction({
          name: 'Reset Password',
          type: 'reset-password',
          position,
          order,
          action: actionFragment,
          hookContent,
          siblingContent,
          graphQLFields: [], // No additional fields needed for password reset
        });

        return {
          build: async (builder) => {
            await builder.apply(
              renderers.mainGroup.render({}),
              renderers.passwordResetDialogGql.render({
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
