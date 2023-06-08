import { Route, Routes } from 'react-router-dom';
import { AppTopbar } from 'src/app/components/AppTopbar';
import { AppLayout } from 'src/components/AppLayout/AppLayout';
import NotFoundPage from './NotFound.page';
import AppsPages from './apps';
import { FeaturesPage } from './features';
import HomePage from './home/home.page';
import ModelsPage from './models';
import SettingsPage from './settings';

function PagesRoot(): JSX.Element {
  return (
    <Routes>
      <Route element={<AppLayout topbar={<AppTopbar />} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/apps/*" element={<AppsPages />} />
        <Route path="/models/*" element={<ModelsPage />} />
        <Route path="/features/*" element={<FeaturesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default PagesRoot;
