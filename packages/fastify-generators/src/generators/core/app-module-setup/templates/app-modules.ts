// @ts-nocheck

export interface AppModule {
  children?: AppModule[];
  TPL_MODULE_FIELDS;
}

type FlattenedAppModule = Omit<AppModule, 'children'>;

export function flattenAppModule(module: AppModule): FlattenedAppModule {
  const { children, ...rest } = module;
  if (!children?.length) {
    return rest;
  }

  const flattenedChildren = children.map((child) => flattenAppModule(child));

  return [module, ...flattenedChildren].reduce(
    (prev, current) => TPL_MODULE_MERGER,
    {},
  );
}
