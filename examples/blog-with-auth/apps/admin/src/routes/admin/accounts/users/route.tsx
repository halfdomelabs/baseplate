import { createFileRoute } from '@tanstack/react-router';

/* TPL_ROUTE_PATH=/admin/accounts/users/ */

export const Route = createFileRoute('/admin/accounts/users')({
  loader: () => ({
    crumb: /* TPL_CRUMB:START */ 'Users' /* TPL_CRUMB:END */,
  }),
});
