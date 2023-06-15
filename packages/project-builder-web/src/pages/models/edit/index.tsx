import { useConfirmDialog } from '@halfdomelabs/ui-components';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, NavigationTabs } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import ModelEditModelPage from './model/model.page';
import ModelEditSchemaPage from './schema/schema.page';
import ModelEditServicePage from './service/service.page';

function ModelEditPage(): JSX.Element {
  const { id } = useParams<'id'>();
  const { parsedProject, setConfig } = useProjectConfig();
  const navigate = useNavigate();
  const { requestConfirm } = useConfirmDialog();
  const toast = useToast();

  const isNew = !id;

  const model = parsedProject.getModels().find((m) => m.uid === id);

  const handleDelete = (): void => {
    try {
      setConfig((draftConfig) => {
        draftConfig.models = draftConfig.models?.filter((m) => m.uid !== id);
      });
      navigate('..');
    } catch (err) {
      toast.error(formatError(err));
    }
  };

  if (!model && id) {
    return <Alert type="error">Unable to find model {id}</Alert>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-row space-x-8">
        <h1>{model?.name || 'New Model'}</h1>
      </div>
      {isNew ? (
        <ModelEditModelPage />
      ) : (
        <>
          <NavigationTabs>
            <NavigationTabs.Tab to="">Model</NavigationTabs.Tab>
            <NavigationTabs.Tab to="service">Services</NavigationTabs.Tab>
            <NavigationTabs.Tab to="schema">Schema</NavigationTabs.Tab>
          </NavigationTabs>
          <div className="bg-slate-200 p-4">
            <Routes>
              <Route index element={<ModelEditModelPage />} />
              <Route path="service" element={<ModelEditServicePage />} />
              <Route path="schema" element={<ModelEditSchemaPage />} />
            </Routes>
          </div>
        </>
      )}
      {!isNew && (
        <Button
          color="light"
          onClick={() => {
            requestConfirm({
              title: 'Confirm delete',
              message: `Are you sure you want to delete ${
                model?.name || 'the model'
              }?`,
              confirmText: 'Delete',
              onSubmit: handleDelete,
            });
          }}
        >
          Delete Model
        </Button>
      )}
    </div>
  );
}

export default ModelEditPage;
