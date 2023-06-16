import { Button, Tabs, useConfirmDialog } from '@halfdomelabs/ui-components';
import { useNavigate, useParams } from 'react-router-dom';
import { NotFoundCard } from 'src/components';
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
    return <NotFoundCard />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-row space-x-8">
        <h1>{model?.name || 'New Model'}</h1>
      </div>
      {isNew ? (
        <ModelEditModelPage />
      ) : (
        <Tabs>
          <Tabs.List>
            <Tabs.Tab>General</Tabs.Tab>
            <Tabs.Tab>Service</Tabs.Tab>
            <Tabs.Tab>Schema</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panels>
            <Tabs.Panel>
              <ModelEditModelPage />
            </Tabs.Panel>
            <Tabs.Panel>
              <ModelEditServicePage />
            </Tabs.Panel>
            <Tabs.Panel>
              <ModelEditSchemaPage />
            </Tabs.Panel>
          </Tabs.Panels>
        </Tabs>
      )}
      {!isNew && (
        <Button
          variant="secondary"
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
