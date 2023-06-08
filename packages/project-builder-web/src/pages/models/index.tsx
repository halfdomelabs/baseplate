import { Route, Routes } from 'react-router-dom';
import ModelListPage from './ModelList.page';
import { ModelsLayout } from './ModelsLayout';
import ModelEditPage from './edit';
import EnumsPage from './enums';

function ModelsPage(): JSX.Element {
  return (
    <Routes>
      <Route element={<ModelsLayout />}>
        <Route index element={<ModelListPage />} />
        <Route path="new" element={<ModelEditPage />} />
        <Route path="edit/:id/*" element={<ModelEditPage />} />
      </Route>
      <Route path="enums/*" element={<EnumsPage />} />
    </Routes>
  );
}

export default ModelsPage;
