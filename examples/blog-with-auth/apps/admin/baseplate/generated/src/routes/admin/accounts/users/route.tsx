import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  /* TPL_ROUTE:START */ '/admin/accounts/users' /* TPL_ROUTE:END */,
)({
  loader: () => ({
    crumb: /* TPL_CRUMB:START */ 'Users' /* TPL_CRUMB:END */,
  }),
});
