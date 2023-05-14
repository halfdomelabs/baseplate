import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@halfdomelabs/core-generators';
import { createProviderType } from '@halfdomelabs/sync';

export interface ReactRouteLayout {
  key: string;
  header?: TypescriptCodeBlock;
  element: TypescriptCodeExpression;
}

export interface ReactRoute {
  path?: string;
  index?: boolean;
  element?: TypescriptCodeExpression;
  layoutKey?: string;
  children?: TypescriptCodeExpression;
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
