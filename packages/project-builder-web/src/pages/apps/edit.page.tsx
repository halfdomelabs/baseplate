import type { BaseAppConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import { appEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog, ErrorDisplay } from '@halfdomelabs/ui-components';
import { useNavigate, useParams } from 'react-router-dom';

import { NotFoundCard } from '@src/components';

import AdminAppForm from './edit/AdminAppForm';
import BackendAppForm from './edit/BackendAppForm';
import WebAppForm from './edit/WebAppForm';

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
          <Dialog.Trigger asChild>
            <Button variant="secondary">Delete</Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete {app.name}</Dialog.Title>
            </Dialog.Header>
            <p>
              Are you sure you want to delete <strong>{app.name}</strong>?
            </p>
            <p className="text-style-muted">
              This action will unlink the app from the generation process, so it
              will no longer be updated or managed through Baseplate. If already
              generated, the app will remain on the file system. You can
              manually delete it afterwards if no longer needed.
            </p>

            <Dialog.Footer>
              <Dialog.Close>
                <Button variant="secondary">Cancel</Button>
              </Dialog.Close>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSavingDefinition}
              >
                Unlink App
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
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
