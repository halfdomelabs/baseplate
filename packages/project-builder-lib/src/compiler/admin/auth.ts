import { AdminAppConfig } from '@src/schema/apps/admin';
import { AppEntryBuilder } from '../appEntryBuilder';

export function compileAuthPages(
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  builder.addDescriptor('auth/root.json', {
    name: 'auth',
    generator: '@baseplate/react/core/react-routes',
    children: {
      $auth: {
        generator: '@baseplate/react/auth/auth-pages',
        children: {
          login: {
            allowedRoles: builder.appConfig.allowedRoles,
          },
        },
      },
    },
  });

  return 'auth/root';
}
