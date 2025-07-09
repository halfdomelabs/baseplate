// @ts-nocheck

import { createFileRoute, redirect } from '@tanstack/react-router';

import { AdminLayout } from '../../components/admin-layout/admin-layout.js';

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  beforeLoad: ({ context: { userId }, location }) => {
    if (!userId) {
      throw redirect({
        to: TPL_LOGIN_URL_PATH,
        search: {
          return_to: location.pathname,
        },
      });
    }
  },
  component: AdminLayout,
});
