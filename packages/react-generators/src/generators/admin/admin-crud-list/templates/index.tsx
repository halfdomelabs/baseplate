// @ts-nocheck

import type { ReactElement } from 'react';

import { ErrorableLoader } from '%reactComponentsImports';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  component: TPL_PAGE_NAME,
});

function TPL_PAGE_NAME(): ReactElement {
  TPL_DATA_LOADER;

  return (
    <div className="flex max-w-4xl flex-col space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1>
          <TPL_TITLE />
        </h1>
        <TPL_CREATE_BUTTON />
      </div>
      {TPL_DATA_PARTS ? (
        <ErrorableLoader error={TPL_ERROR_PARTS} />
      ) : (
        TPL_TABLE_COMPONENT
      )}
    </div>
  );
}
