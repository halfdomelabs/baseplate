// @ts-nocheck

export interface AppModule {
  children?: AppModule[];
  TPL_MODULE_FIELDS;
}

type FlattenedAppModule = Omit<AppModule, 'children'>;

export function flattenAppModule(module: AppModule): FlattenedAppModule {
  const { children = [], ...rootModule } = module;

  const flattenedChildren = children.map(flattenAppModule);

  const result = TPL_MODULE_INITIALIZER;

  // Merge plugins from all flattened children
  for (const child of flattenedChildren) {
    TPL_MODULE_MERGER;
  }

  return result;
}
