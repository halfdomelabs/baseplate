import { ParsedModel } from '@baseplate/project-builder-lib';
import _ from 'lodash';
import { Route, Routes } from 'react-router-dom';
import { Sidebar } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import ModelEditPage from './edit';
import ModelListPage from './list';

function ModelLink({ model }: { model: ParsedModel }): JSX.Element {
  return (
    <Sidebar.LinkItem to={`edit/${model.uid}`}>{model.name}</Sidebar.LinkItem>
  );
}

function ModelsPage(): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const models = parsedProject.getModels();
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
            <ModelLink key={model.uid} model={model} />
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
