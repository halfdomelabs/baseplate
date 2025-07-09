import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export interface ReactAuthRoutesProvider {
  /** Gets the URL path for the login page, e.g. `/auth/login` */
  getLoginUrlPath: () => string;
  /** Gets the URL path for the register page, e.g. `/auth/register` */
  getRegisterUrlPath: () => string;
}

/**
 * A generic provider for using React
 */
export const reactAuthRoutesProvider =
  createReadOnlyProviderType<ReactAuthRoutesProvider>('react-auth-routes');
