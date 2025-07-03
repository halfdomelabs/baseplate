import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/data/models')({
  beforeLoad: () => ({
    getTitle: () => 'Models',
  }),
});
