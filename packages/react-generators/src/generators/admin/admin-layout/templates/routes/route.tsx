// @ts-nocheck

import type { AuthRole } from '%authHooksImports';

import { AdminLayout } from '$adminLayout';
import { InvalidRoleError } from '%authErrorsImports';
import { createFileRoute, redirect } from '@tanstack/react-router';

const REQUIRED_ROLES = new Set<AuthRole>(TPL_REQUIRED_ROLES);

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  beforeLoad: ({ context: { session }, location }) => {
    // An unsettled session cannot answer either question, so the guard re-runs when
    // it settles rather than deciding now.
    if (session.isPending) return;
    if (!session.userId) {
      throw redirect({
        to: TPL_LOGIN_URL_PATH,
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
