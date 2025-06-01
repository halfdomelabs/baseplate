import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createProviderType } from '@baseplate-dev/sync';

export interface ReactRouteLayout {
  key: string;
  header?: TsCodeFragment;
  element: TsCodeFragment;
}

export interface ReactRoute {
  path?: string;
  index?: boolean;
  element?: TsCodeFragment;
  layoutKey?: string;
  children?: TsCodeFragment;
}

export interface ReactRoutesProvider {
  registerLayout(layout: ReactRouteLayout): void;
  registerRoute(route: ReactRoute): void;
  getRoutePrefix(): string;
  getDirectoryBase(): string;
}

export const reactRoutesProvider =
  createProviderType<ReactRoutesProvider>('react-routes');

export interface ReactRoutesReadOnlyProvider {
  getRoutePrefix(): string;
  getDirectoryBase(): string;
}

export const reactRoutesReadOnlyProvider =
  createProviderType<ReactRoutesReadOnlyProvider>('react-routes-read-only', {
    isReadOnly: true,
  });
