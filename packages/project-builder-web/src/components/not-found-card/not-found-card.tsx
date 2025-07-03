import type React from 'react';

import { Button, ErrorDisplay } from '@baseplate-dev/ui-components';
import { Link } from '@tanstack/react-router';

export function NotFoundCard(): React.JSX.Element {
  return (
    <ErrorDisplay
      className="flex-1"
      header="Page not found"
      error="Sorry, we were unable to find the page you were looking for."
      actions={
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      }
    />
  );
}
