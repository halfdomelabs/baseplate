import { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';

export interface AppModule {
  children?: AppModule[];
  plugins?: (FastifyPluginCallback | FastifyPluginAsync)[];
}

type FlattenedAppModule = Omit<AppModule, 'children'>;

export function flattenAppModule(module: AppModule): FlattenedAppModule {
  const { children, ...rest } = module;
  if (!children?.length) {
    return rest;
  }

  const flattenedChildren = children.map((child) => flattenAppModule(child));

  return [module, ...flattenedChildren].reduce(
    (prev, current) => ({
      plugins: [...(prev.plugins ?? []), ...(current.plugins ?? [])],
    }),
    {},
  );
}
