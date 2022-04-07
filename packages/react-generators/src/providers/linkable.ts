import { createProviderType } from '@baseplate/sync';

export interface ReactLinkableProvider {
  getLink(): string;
}

export const reactLinkableProvider =
  createProviderType<ReactLinkableProvider>('react-linkable');
