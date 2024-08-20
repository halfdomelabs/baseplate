import { ModelUtils, modelEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Tabs } from '@halfdomelabs/ui-components';
import { useParams } from 'react-router-dom';

import { ModelHeaderBar } from './ModelHeaderBar';
import ModelEditModelPage from './model/model.page';
import ModelEditSchemaPage from './schema/schema.page';
import ModelEditServicePage from './service/service.page';
import { NotFoundCard } from 'src/components';

function ModelEditPage(): JSX.Element {
  const { uid } = useParams<'uid'>();
  const { definition } = useProjectDefinition();

  const id = modelEntityType.fromUid(uid);

  const model = ModelUtils.byId(definition, id ?? '');

  if (!model) {
    return <NotFoundCard />;
  }

  return (
    <div className="space-y-4" key={id}>
      <ModelHeaderBar model={model} />
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
    </div>
  );
}

export default ModelEditPage;
