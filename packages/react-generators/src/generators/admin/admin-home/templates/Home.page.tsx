// @ts-nocheck

import type { ReactElement } from 'react';

import { useCurrentUser } from '%authHooksImports';
import { ErrorableLoader } from '%reactComponentsImports';

function HomePage(): ReactElement {
  const { user, error } = useCurrentUser();

  if (!user) {
    return <ErrorableLoader error={error} />;
  }

  return (
    <div className="space-y-4">
      <h1>Home</h1>
      <p>Welcome {user.email ?? 'User'}!</p>
    </div>
  );
}

export default HomePage;
