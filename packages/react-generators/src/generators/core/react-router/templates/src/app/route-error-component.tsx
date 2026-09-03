// @ts-nocheck

import type { ErrorRouteComponent } from '@tanstack/react-router';

import { Button, ErrorDisplay } from '%reactComponentsImports';

export function ErrorComponent({
  error,
  reset,
}: React.ComponentProps<ErrorRouteComponent>): React.ReactElement {
  TPL_ERROR_COMPONENT_HEADER;

  TPL_ERROR_COMPONENT_BODY;

  return (
    <ErrorDisplay
      error={error}
      actions={<Button onClick={reset}>Reset</Button>}
    />
  );
}
