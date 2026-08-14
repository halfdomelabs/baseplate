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

import { LOCAL_AUTH_ADMIN_ADMIN_CRUD_INVITE_USER_ACTION_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({
  order: z.int().nonnegative(),
  position: z.enum(['inline', 'dropdown']).default('dropdown'),
});

/**
 * Generator for local-auth/admin/admin-crud-invite-user-action
 */
export const adminCrudInviteUserActionGenerator = createGenerator({
  name: 'local-auth/admin/admin-crud-invite-user-action',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: () => 'invite-user',
  buildTasks: ({ order, position }) => ({
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
        graphqlImports,
        paths,
      }) {
        // Create the action fragment based on position
        const actionFragment =
          position === 'inline'
            ? tsTemplateWithImports([
                reactComponentsImports.Button.declaration(),
                tsImportBuilder(['MdMailOutline']).from('react-icons/md'),
              ])`
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setInviteUserTarget(item);
              }}
            >
              <MdMailOutline />
              <span className="sr-only">Send Invite</span>
            </Button>
          `
            : tsTemplateWithImports([
                reactComponentsImports.DropdownMenuItem.declaration(),
                tsImportBuilder(['MdMailOutline']).from('react-icons/md'),
              ])`
          <DropdownMenuItem
            onClick={() => {
              setInviteUserTarget(item);
            }}
          >
            <MdMailOutline className="mr-2 h-4 w-4" />
            Send Invite
          </DropdownMenuItem>
        `;

        // Hook content for managing the invite dialog state
        const hookContent = tsTemplateWithImports([
          tsImportBuilder(['useState']).from('react'),
          graphqlImports.FragmentType.typeDeclaration(),
          tsImportBuilder(['inviteUserDialogUserFragment'])
            .typeOnly()
            .from(paths.inviteUserDialog),
        ])`
          const [inviteUserTarget, setInviteUserTarget] = useState<FragmentType<typeof inviteUserDialogUserFragment> | null>(
          null,
        );
      `;

        // Sibling component for the invite dialog
        const siblingContent = tsTemplateWithImports([
          tsImportBuilder(['InviteUserDialog']).from(paths.inviteUserDialog),
        ])`
                {inviteUserTarget && (
                  <InviteUserDialog
                    user={inviteUserTarget}
                    open={!!inviteUserTarget}
                    onOpenChange={(open) => {
                      if (!open) setInviteUserTarget(null);
                    }}
                  />
                )}
              `;

        const inviteUserDialogUserFragment: GraphQLFragment = {
          variableName: 'inviteUserDialogUserFragment',
          fragmentName: 'InviteUserDialog_user',
          onType: 'User',
          // fields are not needed here
          fields: [],
          path: paths.inviteUserDialog,
        };

        // Add the action to the container
        adminCrudActionContainer.addAction({
          name: 'Send Invite',
          type: 'invite-user',
          position,
          order,
          action: actionFragment,
          hookContent,
          siblingContent,
          graphQLFields: [
            {
              type: 'spread',
              fragment: inviteUserDialogUserFragment,
            },
          ],
        });

        return {
          build: async (builder) => {
            await builder.apply(renderers.inviteUserDialog.render({}));
          },
        };
      },
    }),
  }),
});
