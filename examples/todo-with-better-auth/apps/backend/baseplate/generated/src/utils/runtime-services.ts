/**
 * Services constructed by {@link createAppRuntime} and delivered on
 * {@link ServiceContext.services}. Deep-readonly: fields, not just the bag.
 *
 * Empty until a plugin contributes a field (e.g. queues, email, storage).
 */
export interface RuntimeServices {
  readonly placeholder?: never;
}
