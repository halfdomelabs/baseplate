import { Route, Routes } from 'react-router-dom';

import PluginsLayout from './PluginsLayout';
import { PluginsHomePage } from './home.page';
import NotFoundPage from '../NotFound.page';

export function PluginsPage(): JSX.Element {
  return (
    <Routes>
      <Route element={<PluginsLayout />}>
        <Route index element={<PluginsHomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
