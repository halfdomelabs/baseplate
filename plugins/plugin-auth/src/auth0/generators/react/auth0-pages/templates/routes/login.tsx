// @ts-nocheck

import { Loader } from '%reactComponentsImports';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/login')({
  beforeLoad: async ({ context: { auth0, userId } }) => {
    if (userId) {
      throw redirect({ to: '/', replace: true });
    }
    await auth0.loginWithRedirect();
  },
  component: Loader,
});
