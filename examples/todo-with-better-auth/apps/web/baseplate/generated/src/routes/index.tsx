import type { ReactElement } from 'react';

import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from '@prisma-crud/ui-shared';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeaderTitle>Hello World</PageHeaderTitle>
        <PageHeaderDescription>
          This is the home page of a generated app.
        </PageHeaderDescription>
      </PageHeader>
    </div>
  );
}
