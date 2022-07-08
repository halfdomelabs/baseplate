import { BaseAppConfig } from '@baseplate/project-builder-lib';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, NotFoundCard } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import AdminAppForm from './edit/AdminAppForm';
import BackendAppForm from './edit/BackendAppForm';
import WebAppForm from './edit/WebAppForm';

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
      setConfigAndFixReferences((oldConfig) => {
        oldConfig.apps = oldConfig.apps.filter((a) => a.uid !== id);
      });
      toast.success(`Successfully deleted app!`);
      navigate('/apps/new');
    } catch (err) {
      toast.error(`Failed to delete app: ${formatError(err)}`);
    }
  };

  return (
    <div className="space-y-4">
      <h1>
        Edit {app.name} ({app.type} app)
      </h1>
      <Button color="light" onClick={handleDelete}>
        Delete
      </Button>
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
