import type { ErrorRouteComponent } from '@tanstack/react-router';

import { Button, ErrorDisplay } from '@prisma-crud/ui-shared';
import { Link } from '@tanstack/react-router';

import { useLogOut } from '../hooks/use-log-out';
import { InvalidRoleError } from '../utils/auth-errors';

export function ErrorComponent({
  error,
  reset,
}: React.ComponentProps<ErrorRouteComponent>): React.ReactElement {
  /* TPL_ERROR_COMPONENT_HEADER:START */
  const logout = useLogOut();
  /* TPL_ERROR_COMPONENT_HEADER:END */

  /* TPL_ERROR_COMPONENT_BODY:START */
  if (error instanceof InvalidRoleError) {
    return (
      <ErrorDisplay
        header="Access Denied"
        error="You are not authorized to access this page. Please contact support if you believe this is an error."
        actions={
          <div className="flex gap-2">
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          </div>
        }
      />
    );
  }
  /* TPL_ERROR_COMPONENT_BODY:END */

  return (
    <ErrorDisplay
      error={error}
      actions={<Button onClick={reset}>Reset</Button>}
    />
  );
}
