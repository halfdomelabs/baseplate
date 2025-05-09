import type { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';

export interface AppModule {
  children?: AppModule[];
  plugins?: (FastifyPluginCallback | FastifyPluginAsync)[];
}

type FlattenedAppModule = Omit<AppModule, 'children'>;

export function flattenAppModule(module: AppModule): FlattenedAppModule {
  const { children = [], ...rootModule } = module;

  const flattenedChildren = children.map(flattenAppModule);

  const result = { plugins: [...(rootModule.plugins ?? [])] };

  // Merge plugins from all flattened children
  for (const child of flattenedChildren) {
    result.plugins.push(...(child.plugins ?? []));
  }

  return result;
}
