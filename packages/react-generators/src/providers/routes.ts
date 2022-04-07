import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@baseplate/core-generators';
import { createProviderType } from '@baseplate/sync';

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
