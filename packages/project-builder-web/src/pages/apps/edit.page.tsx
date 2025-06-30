import type { BaseAppConfig } from '@baseplate-dev/project-builder-lib';
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
  ErrorDisplay,
} from '@baseplate-dev/ui-components';
import { useNavigate, useParams } from 'react-router-dom';

import { NotFoundCard } from '#src/components/index.js';

import AdminAppForm from './edit/admin-app-form.js';
import BackendAppForm from './edit/backend-app-form.js';
import WebAppForm from './edit/web-app-form.js';

function EditAppPage(): React.JSX.Element {
  const { key } = useParams<'key'>();
  const { saveDefinitionWithFeedbackSync, definition, isSavingDefinition } =
    useProjectDefinition();

  const id = key ? appEntityType.idFromKey(key) : undefined;
  const app = id && definition.apps.find((a) => a.id === id);

  const navigate = useNavigate();

  if (!key || !app) {
    return <NotFoundCard />;
  }

  const handleDelete = (): void => {
    saveDefinitionWithFeedbackSync(
      (definition) => {
        definition.apps = definition.apps.filter((a) => a.id !== id);
      },
      {
        successMessage: 'Successfully unlinked app!',
        disableDeleteRefDialog: true,
        onSuccess: () => {
          navigate('/apps');
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
        {(() => {
          switch (app.type) {
            case 'backend': {
              return <BackendAppForm appConfig={app} key={app.id} />;
            }
            case 'web': {
              return <WebAppForm appConfig={app} key={app.id} />;
            }
            case 'admin': {
              return <AdminAppForm appConfig={app} key={app.id} />;
            }
            default: {
              return (
                <ErrorDisplay
                  error={`Unknown app type: ${(app as BaseAppConfig).type}`}
                />
              );
            }
          }
        })()}
      </div>
    </div>
  );
}

export default EditAppPage;
