import type React from 'react';

import { useNavigate } from 'react-router-dom';

import { Button } from '../button/button';
import { ErrorDisplay } from '../error-display/error-display';

export function NotFoundCard(): React.JSX.Element {
  const navigate = useNavigate();
  return (
    <ErrorDisplay
      className="flex-1"
      header="Page not found"
      error="Sorry, we were unable to find the page you were looking for."
      actions={
        <Button
          onClick={() => {
            navigate('/');
          }}
        >
          Back to Home
        </Button>
      }
    />
  );
}
