import type { BaseAppConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import { appEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
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
} from '@halfdomelabs/ui-components';
import { useNavigate, useParams } from 'react-router-dom';

import { NotFoundCard } from '#src/components/index.js';

import AdminAppForm from './edit/AdminAppForm.js';
import BackendAppForm from './edit/BackendAppForm.js';
import WebAppForm from './edit/WebAppForm.js';

function EditAppPage(): React.JSX.Element {
  const { uid } = useParams<'uid'>();
  const { saveDefinitionWithFeedbackSync, definition, isSavingDefinition } =
    useProjectDefinition();

  const id = uid ? appEntityType.fromUid(uid) : undefined;
  const app = id && definition.apps.find((a) => a.id === id);

  const navigate = useNavigate();

  if (!uid || !app) {
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
          navigate('/apps/new');
        },
      },
    );
  };

  const { packageScope } = definition;

  return (
    <div className="space-y-4">
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
              This action will unlink the app from the generation process, so it
              will no longer be updated or managed through Baseplate. If already
              generated, the app will remain on the file system. You can
              manually delete it afterwards if no longer needed.
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
      <div>
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
