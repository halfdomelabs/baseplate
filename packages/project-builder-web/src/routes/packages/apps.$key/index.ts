import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/packages/apps/$key/')({
  loader: ({ params: { key }, context: { app } }) => {
    if (!app) throw notFound();
    const appType = app.type as string;
    if (appType === 'backend') {
      throw redirect({ to: '/packages/apps/$key/backend', params: { key } });
    }
    if (appType === 'web') {
      throw redirect({ to: '/packages/apps/$key/web', params: { key } });
    }
    throw new Error(`Unknown app type: ${app.type}`);
  },
});
