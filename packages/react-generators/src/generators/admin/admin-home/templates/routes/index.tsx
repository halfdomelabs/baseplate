// @ts-nocheck

import type { ReactElement } from 'react';

import { useCurrentUser } from '%authHooksImports';
import { ErrorableLoader } from '%reactComponentsImports';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  component: HomePage,
});

function HomePage(): ReactElement {
  const { user, error } = useCurrentUser();

  if (!user) {
    return <ErrorableLoader error={error} />;
  }

  return (
    <div className="space-y-4">
      <h1>Home</h1>
      <p>Welcome {user.email}!</p>
    </div>
  );
}
