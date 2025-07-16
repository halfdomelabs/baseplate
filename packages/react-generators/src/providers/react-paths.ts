import { createProviderType } from '@baseplate-dev/sync';

export interface ReactPathsProvider {
  getComponentsFolder(): string;
}

export const reactPathsProvider = createProviderType<ReactPathsProvider>(
  'react-paths-provider',
);
