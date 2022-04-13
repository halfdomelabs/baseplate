import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, NavigationTabs } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useStatus } from 'src/hooks/useStatus';
import { formatError } from 'src/services/error-formatter';
import ModelEditModelPage from './model/model.page';
import ModelEditSchemaPage from './schema/schema.page';
import ModelEditServicePage from './service/service.page';

function ModelEditPage(): JSX.Element {
  const { id } = useParams<'id'>();
  const { parsedProject, setConfig } = useProjectConfig();
  const { status, setError } = useStatus();
  const navigate = useNavigate();

  const isNew = !id;

  const model = parsedProject.getModels().find((m) => m.uid === id);

  const handleDelete = (): void => {
    if (window.confirm(`Are you sure you want to delete ${id || 'model'}?`)) {
      try {
        setConfig((oldConfig) => {
          oldConfig.models = oldConfig.models?.filter((m) => m.name !== id);
        });
        navigate('..');
      } catch (err) {
        setError(formatError(err));
      }
    }
  };

  if (!model && id) {
    return <Alert type="error">Unable to find model {id}</Alert>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-row space-x-8">
        <h1>{model?.name || 'New Model'}</h1>
        {!isNew && (
          <Button secondary onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>
      <Alert.WithStatus status={status} />
      {isNew ? (
        <ModelEditModelPage />
      ) : (
        <>
          <NavigationTabs>
            <NavigationTabs.Tab to="">Model</NavigationTabs.Tab>
            <NavigationTabs.Tab to="service">Services</NavigationTabs.Tab>
            <NavigationTabs.Tab to="schema">Schema</NavigationTabs.Tab>
          </NavigationTabs>
          <div className="p-4 bg-slate-200">
            <Routes>
              <Route index element={<ModelEditModelPage />} />
              <Route path="service" element={<ModelEditServicePage />} />
              <Route path="schema" element={<ModelEditSchemaPage />} />
            </Routes>
          </div>
        </>
      )}
    </div>
  );
}

export default ModelEditPage;
