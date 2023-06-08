import { Route, Routes } from 'react-router-dom';
import ModelListPage from './ModelList.page';
import { ModelsLayout } from './components/ModelsLayout';
import ModelEditPage from './edit';

function ModelsPage(): JSX.Element {
  return (
    <Routes>
      <Route element={<ModelsLayout />}>
        <Route index element={<ModelListPage />} />
        <Route path="new" element={<ModelEditPage />} />
        <Route path="edit/:id/*" element={<ModelEditPage />} />
      </Route>
    </Routes>
  );
}

export default ModelsPage;
