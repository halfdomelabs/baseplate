// @ts-nocheck

/**
 * A raw, unflattened module declaration. Feature modules declare this via
 * {@link defineAppModule} - only the root calls {@link flattenAppModule}.
 */
export interface AppModule {
  children?: AppModule[];
  TPL_MODULE_FIELDS;
}

/**
 * Declares a feature module. Identity at runtime; exists so module authors
 * have one call site to reach for instead of a bare `satisfies AppModule`,
 * and so this file has a place to explain the convention: `children` is
 * wired automatically by the module tree and should not be set by hand.
 */
export function defineAppModule(module: AppModule): AppModule {
  return module;
}

/**
 * Flattens a raw module tree into a single set of contributions.
 *
 * Traversal is deterministic pre-order: a module's own contributions in
 * declared order, then its children in declared order, each recursively.
 * This fixes Fastify plugin registration order and similar ordering
 * guarantees for future contributed fields.
 */
export function flattenAppModule(
  module: AppModule,
): Omit<AppModule, 'children'> {
  const { children = [], ...rootModule } = module;

  const flattenedChildren = children.map(flattenAppModule);

  const result = TPL_MODULE_INITIALIZER;

  for (const child of flattenedChildren) {
    TPL_MODULE_MERGER;
  }

  return result;
}
