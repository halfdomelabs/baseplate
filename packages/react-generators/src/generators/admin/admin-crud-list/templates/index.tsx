// @ts-nocheck

import type { ReactElement } from 'react';

import { ErrorableLoader } from '%reactComponentsImports';
import { useMutation } from '@apollo/client';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  component: TPL_PAGE_NAME,
});

function TPL_PAGE_NAME(): ReactElement {
  TPL_DATA_LOADER;
  const [TPL_DELETE_FUNCTION] = useMutation(TPL_DELETE_MUTATION, {
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
    <div className="flex max-w-6xl flex-col space-y-4">
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
