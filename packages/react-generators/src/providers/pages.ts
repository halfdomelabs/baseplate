import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from '@baseplate/core-generators';
import { createProviderType } from '@baseplate/sync';

export interface ReactPagesLayout {
  key: string;
  header?: TypescriptCodeBlock;
  element: TypescriptCodeExpression;
}

export interface ReactPagesRoute {
  path?: string;
  index?: boolean;
  element: TypescriptCodeExpression;
  layoutKey?: string;
}

export interface ReactPagesProvider {
  registerLayout(layout: ReactPagesLayout): void;
  registerRoute(route: ReactPagesRoute): void;
  getRoutePrefix(): string;
  getDirectoryBase(): string;
}

export const reactPagesProvider =
  createProviderType<ReactPagesProvider>('react-pages');
