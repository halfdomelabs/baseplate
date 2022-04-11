import _ from 'lodash';
import { Route, Routes } from 'react-router-dom';
import { Sidebar } from 'src/components';
import { useAppConfig } from 'src/hooks/useAppConfig';
import ModelEditPage from './edit';
import ModelListPage from './list';

function ModelLink({ modelName }: { modelName: string }): JSX.Element {
  return (
    <Sidebar.LinkItem to={`edit/${modelName}`}>{modelName}</Sidebar.LinkItem>
  );
}

function ModelsPage(): JSX.Element {
  const { parsedConfig } = useAppConfig();

  const models = parsedConfig.getModels();
  const sortedModels = _.sortBy(models, (m) => m.name);

  return (
    <div className="h-full items-stretch flex">
      <Sidebar className="flex-none h-full !bg-white">
        <Sidebar.Header className="mb-4">
          <h2>Models</h2>
        </Sidebar.Header>
        <Sidebar.LinkGroup>
          <Sidebar.LinkItem className="text-green-500" to="new">
            New Model
          </Sidebar.LinkItem>
          {sortedModels.map((model) => (
            <ModelLink key={model.name} modelName={model.name} />
          ))}
        </Sidebar.LinkGroup>
      </Sidebar>
      <div className="flex flex-col flex-auto p-4 h-full overflow-y-auto">
        <Routes>
          <Route index element={<ModelListPage />} />
          <Route path="new" element={<ModelEditPage />} />
          <Route path="edit/:id/*" element={<ModelEditPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default ModelsPage;
