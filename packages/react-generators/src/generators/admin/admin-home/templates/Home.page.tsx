// @ts-nocheck

import { useCurrentUser } from '%authHooksImports';
import { ErrorableLoader } from '%reactComponentsImports';

function HomePage(): JSX.Element {
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
