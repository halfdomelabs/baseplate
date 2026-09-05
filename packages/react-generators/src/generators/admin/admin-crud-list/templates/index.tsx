// @ts-nocheck

import type { ReactElement } from 'react';

import { PageHeader, PageHeaderTitle } from '%reactComponentsImports';
import { createFileRoute } from '@tanstack/react-router';

TPL_ITEMS_QUERY;

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  component: TPL_COMPONENT_NAME,
  TPL_ROUTE_PROPS,
});

function TPL_COMPONENT_NAME(): ReactElement {
  TPL_DATA_LOADERS;

  return (
    <div className="flex max-w-4xl flex-col space-y-4">
      <PageHeader className="items-center">
        <PageHeaderTitle>
          <TPL_PAGE_TITLE />
        </PageHeaderTitle>
        <TPL_CREATE_BUTTON />
      </PageHeader>
      <TPL_TABLE_COMPONENT />
    </div>
  );
}
