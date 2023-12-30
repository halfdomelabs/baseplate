import { Route, Routes } from 'react-router-dom';

import EnumEditPage from './edit';

function EnumRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="new" element={<EnumEditPage />} />
      <Route path="edit/:uid/*" element={<EnumEditPage />} />
    </Routes>
  );
}

export default EnumRoutes;
