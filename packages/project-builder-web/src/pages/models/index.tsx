import { Route, Routes } from 'react-router-dom';

import ModelListPage from './ModelList.page';
import { ModelsLayout } from './ModelsLayout';
import ModelEditPage from './edit';
import EnumRoutes from './enums';

function ModelRoutes(): JSX.Element {
  return (
    <Routes>
      <Route element={<ModelsLayout />}>
        <Route index element={<ModelListPage />} />
        <Route path="new" element={<ModelEditPage />} />
        <Route path="edit/:uid/*" element={<ModelEditPage />} />
        <Route path="enums/*" element={<EnumRoutes />} />
      </Route>
    </Routes>
  );
}

export default ModelRoutes;
