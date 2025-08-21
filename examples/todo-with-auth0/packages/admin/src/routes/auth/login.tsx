import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { Loader } from '@src/components/ui/loader';

export const Route = createFileRoute('/auth/login')({
  validateSearch: z.object({
    return_to: z
      .string()
      .regex(/^\/[a-zA-Z0-9\-._~!$&'()*+,;=:@?/]*$/)
      .optional(),
    screen_hint: z.enum(['signup', 'login']).optional(),
  }),
  beforeLoad: async ({
    context: { auth0, userId },
    search: { return_to, screen_hint },
  }) => {
    if (userId) {
      throw redirect({ to: '/', replace: true });
    }
    await auth0.loginWithRedirect({
      appState: { returnTo: return_to },
      authorizationParams: { screen_hint },
      openUrl(url) {
        globalThis.location.replace(url);
      },
    });
  },
  component: Loader,
});
