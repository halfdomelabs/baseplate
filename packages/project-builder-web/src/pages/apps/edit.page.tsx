import { BaseAppConfig } from '@halfdomelabs/project-builder-lib';
import { useNavigate, useParams } from 'react-router-dom';

import AdminAppForm from './edit/AdminAppForm';
import BackendAppForm from './edit/BackendAppForm';
import WebAppForm from './edit/WebAppForm';
import { Alert, Button, NotFoundCard } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';

function EditAppPage(): JSX.Element {
  const { id } = useParams<'id'>();
  const { parsedProject, setConfigAndFixReferences } = useProjectConfig();

  const app = id && parsedProject.getAppByUid(id);

  const toast = useToast();
  const navigate = useNavigate();

  if (!id || !app) {
    return <NotFoundCard />;
  }

  const handleDelete = (): void => {
    if (!window.confirm('Are you sure you want to delete this app?')) {
      return;
    }
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.apps = draftConfig.apps.filter((a) => a.uid !== id);
      });
      toast.success(`Successfully deleted app!`);
      navigate('/apps/new');
    } catch (err) {
      toast.error(`Failed to delete app: ${formatError(err)}`);
    }
  };

  const { packageScope } = parsedProject.projectConfig;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-4">
        <div>
          <h2>{packageScope ? `@${packageScope}/${app.name}` : app.name}</h2>
          <p className="text-base text-foreground-600">{app.type} app</p>
        </div>
        <Button color="light" onClick={handleDelete}>
          Delete
        </Button>
      </div>
      <div>
        {(() => {
          switch (app.type) {
            case 'backend':
              return <BackendAppForm appConfig={app} key={app.uid} />;
            case 'web':
              return <WebAppForm appConfig={app} key={app.uid} />;
            case 'admin':
              return <AdminAppForm appConfig={app} key={app.uid} />;
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
