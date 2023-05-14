import { createProviderType } from '@halfdomelabs/sync';

export interface ReactLinkableProvider {
  getLink(): string;
}

export const reactLinkableProvider =
  createProviderType<ReactLinkableProvider>('react-linkable');
