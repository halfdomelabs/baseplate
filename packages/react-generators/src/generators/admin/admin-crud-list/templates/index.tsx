// @ts-nocheck

import type { ReactElement } from 'react';

import { ErrorableLoader } from '%reactComponentsImports';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(TPL_ROUTE_VALUE)({
  component: TPL_PAGE_NAME,
});

function TPL_PAGE_NAME(): ReactElement {
  TPL_DATA_LOADER;
  const [TPL_DELETE_FUNCTION] = TPL_DELETE_MUTATION({
    refetchQueries: [
      {
        query: TPL_REFETCH_DOCUMENT,
      },
    ],
  });

  const handleDeleteItem = async (
    item: TPL_ROW_FRAGMENT_NAME,
  ): Promise<void> => {
    await TPL_DELETE_FUNCTION({
      variables: { input: { id: item.id } },
    });
  };

  return (
    <div className="space-y-4">
      <h1>
        <TPL_PLURAL_MODEL />
      </h1>
      <TPL_CREATE_BUTTON />
      {TPL_DATA_PARTS ? (
        <ErrorableLoader error={TPL_ERROR_PARTS} />
      ) : (
        TPL_TABLE_COMPONENT
      )}
    </div>
  );
}
