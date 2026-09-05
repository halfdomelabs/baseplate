import type { ReactElement } from 'react';

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage(): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Hello World</h1>
      <p>This is the home page of a generated app.</p>
    </div>
  );
}
