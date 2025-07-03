import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/apps/edit/$key/')({
  beforeLoad: ({ params: { key }, context: { app } }) => {
    const appType = app.type as string;
    if (appType === 'admin') {
      throw redirect({ to: '/apps/edit/$key/admin', params: { key } });
    }
    if (appType === 'backend') {
      throw redirect({ to: '/apps/edit/$key/backend', params: { key } });
    }
    if (appType === 'web') {
      throw redirect({ to: '/apps/edit/$key/web', params: { key } });
    }
    throw new Error(`Unknown app type: ${app.type}`);
  },
});
