import { ConfirmDialog } from '@halfdomelabs/ui-components';
import { Toaster } from 'react-hot-toast';
import {
  Outlet,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';

import { AppTopbar } from './components/AppTopbar';
import { ClientVersionGate } from './components/ClientVersionGate';
import { ProjectChooserGate } from './components/ProjectChooserGate';
import { ProjectConfigGate } from './components/ProjectConfigGate';
import { AppLayout } from '@src/components/AppLayout/AppLayout';
import { RefIssueDialog } from '@src/components/RefIssueDialog/RefIssueDialog';
import NotFoundPage from '@src/pages/NotFound.page';
import AppsPages from '@src/pages/apps';
import { FeaturesPage } from '@src/pages/features';
import HomePage from '@src/pages/home/home.page';
import ModelsPages from '@src/pages/models';
import SettingsPage from '@src/pages/settings';
import { ErrorBoundary } from 'src/components/ErrorBoundary/ErrorBoundary';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route path="/" element={<AppLayout topbar={<AppTopbar />} />}>
        <Route index element={<HomePage />} />
        <Route path="/apps/*" element={<AppsPages />} />
        <Route path="/models/*" element={<ModelsPages />} />
        <Route path="/features/*" element={<FeaturesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>,
  ),
);

function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <ClientVersionGate>
        <ProjectChooserGate>
          <ProjectConfigGate>
            <Outlet />
            <RefIssueDialog />
          </ProjectConfigGate>
        </ProjectChooserGate>
        <Toaster />
        <ConfirmDialog />
      </ClientVersionGate>
    </ErrorBoundary>
  );
}

export default App;
