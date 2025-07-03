import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/data/enums')({
  beforeLoad: () => ({
    getTitle: () => 'Enums',
  }),
});
