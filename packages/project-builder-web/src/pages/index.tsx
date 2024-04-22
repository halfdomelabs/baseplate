import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';

import NotFoundPage from './NotFound.page';
import AppsPages from './apps';
import { FeaturesPage } from './features';
import HomePage from './home/home.page';
import ModelsPage from './models';
import SettingsPage from './settings';
import App from '@src/app/App';
import { AppTopbar } from 'src/app/components/AppTopbar';
import { AppLayout } from 'src/components/AppLayout/AppLayout';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<App />}>
      <Route element={<AppLayout topbar={<AppTopbar />} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/apps/*" element={<AppsPages />} />
        <Route path="/models/*" element={<ModelsPage />} />
        <Route path="/features/*" element={<FeaturesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>,
  ),
);
