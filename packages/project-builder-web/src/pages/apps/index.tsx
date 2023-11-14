import { Route, Routes } from 'react-router-dom';

import AppsLayout from './AppsLayout.page';
import EditAppPage from './edit.page';
import { AppsListPage } from './list.page';
import NewAppPage from './new.page';
import NotFoundPage from '../NotFound.page';

function AppsPages(): JSX.Element {
  return (
    <Routes>
      <Route element={<AppsLayout />}>
        <Route index element={<AppsListPage />} />
        <Route path="new" element={<NewAppPage />} />
        <Route path="edit/:id/*" element={<EditAppPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppsPages;
