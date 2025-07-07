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

/**
 * Provider for accessing TanStack route configuration.
 */
export interface ReactRoutesProvider {
  /**
   * Gets the prefix of the navigatable route, e.g. `/admin/user/$id`
   */
  getRoutePrefix(): string;
  /**
   * Gets the file path relative to the route directory (used in createFileRoute) without trailing slash, e.g. `_pathless/admin/user/$id`.
   */
  getRouteFilePath(): string;
  /**
   * Gets the output relative path to the route directory, e.g. `@/src/routes/admin/user/$id`.
   */
  getOutputRelativePath(): string;
}

export const reactRoutesProvider =
  createProviderType<ReactRoutesProvider>('react-routes');
