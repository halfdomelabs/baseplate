// @ts-nocheck

import { Loader } from '%reactComponentsImports';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/register')({
  beforeLoad: async ({ context: { auth0, userId } }) => {
    if (userId) {
      throw redirect({ to: '/', replace: true });
    }
    await auth0.loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
      },
    });
  },
  component: Loader,
});
