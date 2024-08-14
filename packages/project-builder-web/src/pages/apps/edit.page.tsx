import {
  BaseAppConfig,
  appEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog } from '@halfdomelabs/ui-components';
import { useNavigate, useParams } from 'react-router-dom';

import AdminAppForm from './edit/AdminAppForm';
import BackendAppForm from './edit/BackendAppForm';
import WebAppForm from './edit/WebAppForm';
import { Alert, NotFoundCard } from 'src/components';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';

function EditAppPage(): JSX.Element {
  const { uid } = useParams<'uid'>();
  const { parsedProject, setConfigAndFixReferences, definition } =
    useProjectDefinition();

  const id = uid ? appEntityType.fromUid(uid) : undefined;
  const app = id && definition.apps.find((a) => a.id === id);

  const toast = useToast();
  const navigate = useNavigate();

  if (!uid || !app) {
    return <NotFoundCard />;
  }

  const handleDelete = (): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.apps = draftConfig.apps.filter((a) => a.id !== id);
      });
      toast.success(`Successfully unlinked app!`);
      navigate('/apps/new');
    } catch (err) {
      toast.error(`Failed to unlink app: ${formatError(err)}`);
    }
  };

  const { packageScope } = parsedProject.projectDefinition;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-4">
        <div>
          <h2>{packageScope ? `@${packageScope}/${app.name}` : app.name}</h2>
          <p className="text-base text-muted-foreground">{app.type} app</p>
        </div>
        <Dialog>
          <Dialog.Trigger>
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
              <Button variant="destructive" onClick={handleDelete}>
                Unlink App
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </div>
      <div>
        {(() => {
          switch (app.type) {
            case 'backend':
              return <BackendAppForm appConfig={app} key={app.id} />;
            case 'web':
              return <WebAppForm appConfig={app} key={app.id} />;
            case 'admin':
              return <AdminAppForm appConfig={app} key={app.id} />;
            default:
              return (
                <Alert type="error">
                  Unknown App Type {(app as BaseAppConfig).type}
                </Alert>
              );
          }
        })()}
      </div>
    </div>
  );
}

export default EditAppPage;
