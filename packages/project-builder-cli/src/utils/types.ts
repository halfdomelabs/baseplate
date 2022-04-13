/**
 * Typescript hack to force IDEs to show raw object
 * type without additional typing that we have added
 */
export type NormalizeTypes<T> = T extends Record<string, unknown>
  ? {
      [K in keyof T]: T[K];
    }
  : T;

// workaround for https://github.com/jquense/yup/issues/1210

// taken from https://github.com/jquense/yup/issues/1210#issuecomment-1049817680

type OmitIfNotOptional<T extends object> = {
  [Key in keyof T as undefined extends T[Key] ? Key : never]: T[Key];
};

type OmitIfOptional<T extends object> = {
  [Key in keyof T as undefined extends T[Key] ? never : Key]: T[Key];
};

// eslint-disable-next-line @typescript-eslint/ban-types
type PassThroughUnion = String | Number | Date | Function | RegExp; // May be completed with other builtin classes.

export type MakeUndefinableFieldsOptional<
  T,
  ExtraPassThroughTypes = never
> = T extends PassThroughUnion | ExtraPassThroughTypes
  ? T
  : T extends (infer E)[]
  ? MakeUndefinableFieldsOptional<E>[]
  : T extends object
  ? {
      [Key in keyof OmitIfOptional<T>]: MakeUndefinableFieldsOptional<T[Key]>;
    } & {
      [Key in keyof OmitIfNotOptional<T>]?: MakeUndefinableFieldsOptional<
        T[Key]
      >;
    }
  : T;
