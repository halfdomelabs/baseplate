import { Route, Routes } from 'react-router-dom';
import NotFoundPage from '../NotFound.page';
import { FeaturesHomePage } from './FeaturesHome.page';
import FeaturesLayout from './FeaturesLayout';
import AuthPage from './auth';
import StoragePage from './storage';

export function FeaturesPage(): JSX.Element {
  return (
    <Routes>
      <Route element={<FeaturesLayout />}>
        <Route index element={<FeaturesHomePage />} />
        <Route path="auth/*" element={<AuthPage />} />
        <Route path="storage/*" element={<StoragePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
