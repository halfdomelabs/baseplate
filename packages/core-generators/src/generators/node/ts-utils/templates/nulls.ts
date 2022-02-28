import { NormalizeTypes } from './normalizeTypes';

/**
 * Restricts an object from having null in certain fields. This
 * is useful when you want to enforce certain fields are not null
 * when coming from GraphQL which only has the option of
 * defining null | undefined fields.
 *
 * @param object Object to validate
 * @param restrictedKeys Prevents these keys from being set to null
 * @returns A newly typed object whose restrictedKeys are not null
 */
export function restrictNulls<
  ObjectType extends Record<string, unknown>,
  NonNullKeys extends keyof ObjectType
>(
  object: ObjectType,
  nonNullKeys: NonNullKeys[]
): NormalizeTypes<
  ObjectType & { [K in NonNullKeys]: Exclude<ObjectType[K], null> }
> {
  const nullKey = nonNullKeys.find((key) => object[key] === null);
  if (nullKey) {
    throw new Error(`${nullKey.toString()} cannot be null`);
  }
  return object as NormalizeTypes<
    ObjectType & {
      [K in NonNullKeys]: Exclude<ObjectType[K], null>;
    }
  >;
}
