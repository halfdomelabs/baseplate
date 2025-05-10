import type { ReactElement } from 'react';

import * as Sentry from '@sentry/react';
import { Route, Routes } from 'react-router-dom';

import { HomePage } from './home.page';
import NotFoundPage from './NotFound.page';

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

function PagesRoot(): ReactElement {
  return (
    <SentryRoutes>
      <Route index element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </SentryRoutes>
  );
}

export default PagesRoot;
