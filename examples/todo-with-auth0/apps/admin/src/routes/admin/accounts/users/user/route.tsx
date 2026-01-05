import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/accounts/users/user' /* TPL_ROUTE_PATH:END */,
)({
  loader: () => ({
    crumb: /* TPL_CRUMB:START */ 'Users' /* TPL_CRUMB:END */,
  }),
});
