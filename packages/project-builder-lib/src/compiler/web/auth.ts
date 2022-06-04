import { WebAppConfig } from '@src/schema';
import { AppEntryBuilder } from '../appEntryBuilder';

export function compileAuthPages(
  builder: AppEntryBuilder<WebAppConfig>
): unknown {
  if (!builder.appConfig.includeAuth) {
    return null;
  }

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
