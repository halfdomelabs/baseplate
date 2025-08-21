import type { ReactElement } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { ErrorableLoader } from '@src/components/ui/errorable-loader';
import { useCurrentUser } from '@src/hooks/use-current-user';

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/' /* TPL_ROUTE_PATH:END */,
)({
  component: HomePage,
});

function HomePage(): ReactElement {
  const { user, error } = useCurrentUser();

  if (!user) {
    return <ErrorableLoader error={error} />;
  }

  return (
    <div className="space-y-4">
      <p>Welcome {user.email}!</p>
    </div>
  );
}
