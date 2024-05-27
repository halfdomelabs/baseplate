import { Route, Routes } from 'react-router-dom';

import PluginsLayout from './PluginsLayout';
import { PluginsHomePage } from './home.page';
import NotFoundPage from '../NotFound.page';
import { useFeatureFlag } from '@src/hooks/useFeatureFlag';

export function PluginsPage(): JSX.Element {
  const isPluginsEnabled = useFeatureFlag('plugins');

  if (!isPluginsEnabled) {
    return <NotFoundPage />;
  }

  return (
    <Routes>
      <Route element={<PluginsLayout />}>
        <Route index element={<PluginsHomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
