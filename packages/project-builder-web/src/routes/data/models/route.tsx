import { createFileRoute } from '@tanstack/react-router';

import { NotFoundCard } from '#src/components/index.js';

export const Route = createFileRoute('/data/models')({
  beforeLoad: () => ({
    getTitle: () => 'Models',
  }),
  notFoundComponent: NotFoundCard,
});
