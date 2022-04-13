import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, NotFoundCard } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import BackendAppForm from './edit/BackendAppForm';

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
      <Button secondary onClick={handleDelete}>
        Delete
      </Button>
      <div>
        {(() => {
          switch (app.type) {
            case 'backend':
              return <BackendAppForm appConfig={app} />;
            default:
              return <Alert type="error">Unknown App Type {app.type}</Alert>;
          }
        })()}
      </div>
    </div>
  );
}

export default EditAppPage;
