// @ts-nocheck

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/accounts/users')({
  loader: () => ({
    crumb: TPL_CRUMB,
  }),
});
