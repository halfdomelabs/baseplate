/**
 * Shared utilities for authorizer expression code generation.
 *
 * Used by both the authorizer compiler (boolean checks) and
 * the query filter compiler (Prisma where clauses).
 */

import type {
  FieldRefNode,
  LiteralValueNode,
} from '@baseplate-dev/project-builder-lib';

import { quot } from '@baseplate-dev/utils';

/**
 * Serialize a literal value as a TypeScript literal string.
 *
 * - Strings are quoted with `quot()`
 * - Numbers and booleans are emitted as-is via `String()`
 */
export function serializeLiteralValue(
  value: string | number | boolean,
): string {
  if (typeof value === 'string') {
    return quot(value);
  }
  return String(value);
}

/**
 * Generate TypeScript code for a field reference or literal value.
 *
 * - `model.field` → `model.field`
 * - auth field → `ctx.auth.field`
 * - literal → serialized value
 */
export function generateFieldRefOrLiteralCode(
  node: FieldRefNode | LiteralValueNode,
): string {
  if (node.type === 'literalValue') {
    return serializeLiteralValue(node.value);
  }
  if (node.source === 'model') {
    return `model.${node.field}`;
  }
  return `ctx.auth.${node.field}`;
}

/** An auth-field ref whose non-null form is guaranteed once authenticated. */
export function isGuaranteedAuthField(
  node: FieldRefNode | LiteralValueNode,
): boolean {
  return (
    node.type === 'fieldRef' &&
    node.source === 'auth' &&
    node.field === 'userId'
  );
}

/**
 * Like {@link generateFieldRefOrLiteralCode}, but auth refs render as
 * `session.field` (the `r.userMatch`/`r.userWhere` callback param — a
 * guaranteed-authenticated session) instead of `ctx.auth.field`.
 */
export function generateFieldRefOrLiteralCodeForSession(
  node: FieldRefNode | LiteralValueNode,
): string {
  if (node.type === 'literalValue') {
    return serializeLiteralValue(node.value);
  }
  if (node.source === 'model') {
    return `model.${node.field}`;
  }
  return `session.${node.field}`;
}
