/**
 * Typescript hack to force IDEs to show raw object
 * type without additional typing that we have added
 */
export type NormalizeTypes<T> = T extends Record<string, unknown>
  ? {
      [K in keyof T]: T[K];
    }
  : T;
