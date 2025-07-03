import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/data/')({
  beforeLoad: () => {
    redirect({ to: '/data/models', throw: true });
  },
});
