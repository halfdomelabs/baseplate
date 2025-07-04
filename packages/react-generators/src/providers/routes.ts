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
  getRoutePrefix(): string;
  getDirectoryBase(): string;
}

export const reactRoutesProvider =
  createProviderType<ReactRoutesProvider>('react-routes');
