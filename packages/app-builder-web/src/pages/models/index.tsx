import classNames from 'classnames';
import {
  Link,
  Route,
  Routes,
  useMatch,
  useResolvedPath,
} from 'react-router-dom';
import { useAppConfig } from 'src/hooks/useAppConfig';
import ModelEditPage from './edit';
import ModelListPage from './list';

function ModelLink({ modelName }: { modelName: string }): JSX.Element {
  const link = `edit/${modelName}`;
  const resolved = useResolvedPath(link);
  const match = useMatch({ path: resolved.pathname, end: true });
  return (
    <Link
      className={classNames(
        'text-lg block hover:underline',
        match && 'font-bold'
      )}
      to={link}
    >
      {modelName}
    </Link>
  );
}

function ModelsPage(): JSX.Element {
  const { parsedConfig } = useAppConfig();

  return (
    <div className="h-full items-stretch flex">
      <div className="flex-none h-full overflow-y-auto w-64 p-4 bg-slate-300 space-y-4">
        <h2>Models</h2>
        <ul className="space-y-4">
          <li>
            <Link
              className="text-lg block hover:underline text-green-800"
              to="new"
            >
              New Model
            </Link>
          </li>
          {parsedConfig.getModels().map((model) => (
            <li key={model.name}>
              <ModelLink modelName={model.name} />
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col flex-auto p-4 h-full overflow-y-auto">
        <Routes>
          <Route index element={<ModelListPage />} />
          <Route path="new" element={<ModelEditPage />} />
          <Route path="edit/:id" element={<ModelEditPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default ModelsPage;
