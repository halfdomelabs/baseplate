// @ts-nocheck

/**
 * Services constructed by {@link createAppRuntime} and delivered on
 * {@link ServiceContext.services}. Fields are `readonly`, so the modifier
 * survives `Pick<AppServices, K>` at every narrowing site.
 */
export interface AppServices {
  TPL_SERVICES_FIELDS;
}
