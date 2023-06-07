import { Route, Routes } from 'react-router-dom';
import AppSidebar from 'src/app/Sidebar';
import { AppTopbar } from 'src/app/components/AppTopbar';
import { AppLayout } from 'src/components/AppLayout/AppLayout';
import { Layout } from '../components';
import NotFoundPage from './NotFound.page';
import AppsPages from './apps';
import AuthPage from './auth';
import EnumsPage from './enums';
import GeneralPage from './general';
import HomePage from './home/home.page';
import ModelsPage from './models';
import StoragePage from './storage';

function PagesRoot(): JSX.Element {
  return (
    <Routes>
      <Route element={<AppLayout topbar={<AppTopbar />} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/general" element={<GeneralPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/storage" element={<StoragePage />} />
        <Route path="/apps/*" element={<AppsPages />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<Layout noPadding sidebar={<AppSidebar />} />}>
        <Route path="/models/*" element={<ModelsPage />} />
        <Route path="/enums/*" element={<EnumsPage />} />
      </Route>
    </Routes>
  );
}

export default PagesRoot;
