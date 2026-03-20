import type React from 'react';

import { appEntityType } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import {
  createFileRoute,
  notFound,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';
import { HiDotsVertical } from 'react-icons/hi';

import { logAndFormatError } from '#src/services/error-formatter.js';

export const Route = createFileRoute('/packages/apps/$key')({
  component: EditAppPage,
  beforeLoad: ({ params: { key }, context: { projectDefinition } }) => {
    const id = appEntityType.idFromKey(key);
    const app = id && projectDefinition.apps.find((a) => a.id === id);
    if (!app) {
      return {};
    }
    return {
      getTitle: () => app.name,
      app,
    };
  },
  // Workaround for https://github.com/TanStack/router/issues/2139#issuecomment-2632375738
  // where throwing notFound() in beforeLoad causes the not found component to be rendered incorrectly
  loader: ({ context: { app } }) => {
    if (!app) throw notFound();
    return { app };
  },
});

function EditAppPage(): React.JSX.Element {
  const { definition, saveDefinitionWithFeedbackSync, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();
  const { requestConfirm } = useConfirmDialog();

  const { app } = Route.useLoaderData();

  const { packageScope } = definition.settings.general;

  function handleUnlink(): void {
    saveDefinitionWithFeedbackSync(
      (draft) => {
        draft.apps = draft.apps.filter((a) => a.id !== app.id);
      },
      {
        successMessage: 'Successfully unlinked app!',
        disableDeleteRefDialog: true,
        onSuccess: () => {
          navigate({ to: '/packages' }).catch(logAndFormatError);
        },
      },
    );
  }

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={app.id}
    >
      <div className="max-w-7xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2>{packageScope ? `@${packageScope}/${app.name}` : app.name}</h2>
            <Badge variant="secondary">{app.type}</Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <HiDotsVertical aria-label="More Actions" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSavingDefinition}
                  onClick={() => {
                    requestConfirm({
                      title: 'Unlink App',
                      content: `Are you sure you want to unlink ${app.name}? The app will be removed from Baseplate but generated files will remain on disk.`,
                      onConfirm: handleUnlink,
                    });
                  }}
                >
                  Unlink App
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div
        className="mb-(--action-bar-height) flex flex-1 overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <Outlet />
      </div>
    </div>
  );
}
