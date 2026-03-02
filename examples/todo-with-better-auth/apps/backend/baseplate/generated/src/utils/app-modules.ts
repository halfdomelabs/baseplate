import type { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';

export interface AppModule {
  children?: AppModule[];
  /* TPL_MODULE_FIELDS:START */
  plugins?: (FastifyPluginCallback | FastifyPluginAsync)[];
  /* TPL_MODULE_FIELDS:END */
}

type FlattenedAppModule = Omit<AppModule, 'children'>;

export function flattenAppModule(module: AppModule): FlattenedAppModule {
  const { children = [], ...rootModule } = module;

  const flattenedChildren = children.map(flattenAppModule);

  const result = /* TPL_MODULE_INITIALIZER:START */ {
    plugins: [...(rootModule.plugins ?? [])],
  }; /* TPL_MODULE_INITIALIZER:END */

  // Merge plugins from all flattened children
  for (const child of flattenedChildren) {
    /* TPL_MODULE_MERGER:START */
    result.plugins.push(...(child.plugins ?? []));
    /* TPL_MODULE_MERGER:END */
  }

  return result;
}
