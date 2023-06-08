import { Route, Routes } from 'react-router-dom';
import EnumListPage from './EnumList.page';
import { EnumsLayout } from './EnumsLayout';
import EnumEditPage from './edit';

function EnumsPage(): JSX.Element {
  return (
    <Routes>
      <Route element={<EnumsLayout />}>
        <Route index element={<EnumListPage />} />
        <Route path="new" element={<EnumEditPage />} />
        <Route path="edit/:id/*" element={<EnumEditPage />} />
      </Route>
    </Routes>
  );
}

export default EnumsPage;
