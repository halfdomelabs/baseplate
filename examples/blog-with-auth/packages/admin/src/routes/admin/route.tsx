import { createFileRoute, redirect } from '@tanstack/react-router';

import type { AuthRole } from '@src/hooks/use-session';

import { AdminLayout } from '@src/components/layouts/admin-layout';
import { InvalidRoleError } from '@src/utils/auth-errors';

const REQUIRED_ROLES = new Set<AuthRole>(
  /* TPL_REQUIRED_ROLES:START */ ['admin'] /* TPL_REQUIRED_ROLES:END */,
);

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin' /* TPL_ROUTE_PATH:END */,
)({
  beforeLoad: ({ context: { session }, location }) => {
    if (!session.userId) {
      throw redirect({
        to: /* TPL_LOGIN_URL_PATH:START */ '/auth/login' /* TPL_LOGIN_URL_PATH:END */,
        search: {
          return_to: location.pathname,
        },
      });
    }
    if (
      REQUIRED_ROLES.size > 0 &&
      !session.roles.some((role) => REQUIRED_ROLES.has(role))
    ) {
      throw new InvalidRoleError('You are not authorized to access this page.');
    }
  },
  loader: () => ({
    crumb: 'Dashboard',
  }),
  component: AdminLayout,
});
