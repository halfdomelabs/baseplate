import type React from 'react';

import { appEntityType } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@baseplate-dev/ui-components';
import {
  createFileRoute,
  notFound,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';

import { logAndFormatError } from '#src/services/error-formatter.js';

export const Route = createFileRoute('/apps/edit/$key')({
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
  const { saveDefinitionWithFeedbackSync, definition, isSavingDefinition } =
    useProjectDefinition();

  const { app } = Route.useLoaderData();

  const navigate = useNavigate({ from: Route.fullPath });

  const handleDelete = (): void => {
    saveDefinitionWithFeedbackSync(
      (definition) => {
        definition.apps = definition.apps.filter((a) => a.id !== app.id);
      },
      {
        successMessage: 'Successfully unlinked app!',
        disableDeleteRefDialog: true,
        onSuccess: () => {
          navigate({ to: '/apps' }).catch(logAndFormatError);
        },
      },
    );
  };

  const { packageScope } = definition.settings.general;

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={app.id}
    >
      <div className="max-w-7xl space-y-4 p-4">
        <div className="flex items-center justify-between space-x-4">
          <div>
            <h2>{packageScope ? `@${packageScope}/${app.name}` : app.name}</h2>
            <p className="text-base text-muted-foreground">{app.type} app</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Delete</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete {app.name}</DialogTitle>
              </DialogHeader>
              <p>
                Are you sure you want to delete <strong>{app.name}</strong>?
              </p>
              <p className="text-style-muted">
                This action will unlink the app from the generation process, so
                it will no longer be updated or managed through Baseplate. If
                already generated, the app will remain on the file system. You
                can manually delete it afterwards if no longer needed.
              </p>

              <DialogFooter>
                <DialogClose>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSavingDefinition}
                >
                  Unlink App
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
