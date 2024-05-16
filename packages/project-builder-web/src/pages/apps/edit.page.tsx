import {
  BaseAppConfig,
  appEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useConfirmDialog } from '@halfdomelabs/ui-components';
import { useNavigate, useParams } from 'react-router-dom';

import AdminAppForm from './edit/AdminAppForm';
import BackendAppForm from './edit/BackendAppForm';
import WebAppForm from './edit/WebAppForm';
import { Alert, Button, NotFoundCard } from 'src/components';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';

function EditAppPage(): JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { uid } = useParams<'uid'>();
  const { parsedProject, setConfigAndFixReferences, config } =
    useProjectDefinition();

  const id = uid ? appEntityType.fromUid(uid) : undefined;
  const app = id && config.apps.find((a) => a.id === id);

  const toast = useToast();
  const navigate = useNavigate();

  if (!uid || !app) {
    return <NotFoundCard />;
  }

  const handleDelete = (): void => {
    requestConfirm({
      title: 'Delete App',
      content: `Are you sure you want to delete ${app.name}?`,
      onConfirm: () => {
        try {
          setConfigAndFixReferences((draftConfig) => {
            draftConfig.apps = draftConfig.apps.filter((a) => a.id !== id);
          });
          toast.success(`Successfully deleted app!`);
          navigate('/apps/new');
        } catch (err) {
          toast.error(`Failed to delete app: ${formatError(err)}`);
        }
      },
    });
  };

  const { packageScope } = parsedProject.projectDefinition;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-4">
        <div>
          <h2>{packageScope ? `@${packageScope}/${app.name}` : app.name}</h2>
          <p className="text-base text-muted-foreground">{app.type} app</p>
        </div>
        <Button color="light" onClick={handleDelete}>
          Delete
        </Button>
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
