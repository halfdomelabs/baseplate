import { Route, Routes } from 'react-router-dom';
import NotFoundPage from '../NotFound.page';
import EditAppPage from './edit.page';
import NewAppPage from './new.page';

function AppsPages(): JSX.Element {
  return (
    <div>
      <Routes>
        <Route path="new" element={<NewAppPage />} />
        <Route path="edit/:id/*" element={<EditAppPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default AppsPages;
