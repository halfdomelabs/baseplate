import { FeatureUtils } from '@halfdomelabs/project-builder-lib';
import { Tabs } from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { MdEdit } from 'react-icons/md';
import { useParams } from 'react-router-dom';

import { ModelGeneralEditDialog } from './ModelGeneralEditDialog';
import ModelEditModelPage from './model/model.page';
import ModelEditSchemaPage from './schema/schema.page';
import ModelEditServicePage from './service/service.page';
import { NotFoundCard } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

function ModelEditPage(): JSX.Element {
  const { id } = useParams<'id'>();
  const {
    parsedProject,
    definitionContainer: { definition },
  } = useProjectConfig();

  const isNew = !id;

  const model = parsedProject.getModels().find((m) => m.uid === id);

  const [showNameModal, setShowNameModal] = useState(false);

  if (!model && id) {
    return <NotFoundCard />;
  }

  return (
    <div className="space-y-4" key={id}>
      {model ? (
        <div className="flex flex-col items-start">
          <button
            className="group flex items-center space-x-2 hover:cursor-pointer"
            onClick={() => {
              setShowNameModal(true);
            }}
            type="button"
          >
            <h1>{model.name}</h1>
            <MdEdit className="invisible h-4 w-4 group-hover:visible" />
          </button>
          {model?.feature && (
            <div className="text-xs text-muted-foreground">
              {FeatureUtils.getFeatureById(definition, model.feature)?.name}
            </div>
          )}
          <ModelGeneralEditDialog
            isOpen={showNameModal}
            onClose={() => {
              setShowNameModal(false);
            }}
          />
        </div>
      ) : (
        <h1>New Model</h1>
      )}
      {isNew ? (
        <ModelEditModelPage />
      ) : (
        <Tabs defaultValue="fields">
          <Tabs.List>
            <Tabs.Trigger value="fields">Fields</Tabs.Trigger>
            <Tabs.Trigger value="service">Service</Tabs.Trigger>
            <Tabs.Trigger value="schema">Schema</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="fields">
            <ModelEditModelPage />
          </Tabs.Content>
          <Tabs.Content value="service">
            <ModelEditServicePage />
          </Tabs.Content>
          <Tabs.Content value="schema">
            <ModelEditSchemaPage />
          </Tabs.Content>
        </Tabs>
      )}
    </div>
  );
}

export default ModelEditPage;
