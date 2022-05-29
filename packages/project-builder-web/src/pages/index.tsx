import { Route, Routes } from 'react-router-dom';
import { Layout } from '../components';
import NotFoundPage from './NotFound.page';
import AppsPages from './apps';
import AuthPage from './auth';
import GeneralPage from './general';
import HomePage from './home/home.page';
import ModelsPage from './models';
import StoragePage from './storage';

function PagesRoot(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/general" element={<GeneralPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/storage" element={<StoragePage />} />
        <Route path="/apps/*" element={<AppsPages />} />
      </Route>
      <Route element={<Layout noPadding />}>
        <Route path="/models/*" element={<ModelsPage />} />
      </Route>
      <Route element={<Layout centered />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default PagesRoot;
