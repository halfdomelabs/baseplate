// @ts-nocheck

/**
 * The public service API, delivered on `ServiceContext.services`. Fields are
 * `readonly`, so the modifier survives `Pick<AppServices, K>` at every
 * narrowing site.
 */
export interface AppServices {
  TPL_SERVICES_FIELDS;
}

/**
 * Services consumed only by machinery - workers and scripts - and never by a
 * request-scoped context. Reached by naming the key in
 * `SystemServiceContextWith`. A service belongs here only once something
 * consumes it through a context; anything used purely to construct another
 * service is injected at its construction site instead.
 */
export interface InternalServices {
  TPL_INTERNAL_SERVICES_FIELDS;
}

/** Every service the runtime constructs, held by `AppRuntime.services`. */
export type RuntimeServices = AppServices & InternalServices;
