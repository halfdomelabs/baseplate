// @ts-nocheck

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  loader: () => ({
    crumb: TPL_CRUMB,
  }),
});
