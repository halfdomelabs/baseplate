import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { z } from 'zod';

export const pageSizeSchema = {
  /**
   * Page size applied when the caller requests no explicit size. Without it an
   * offset surface returns every matching row.
   */
  defaultPageSize: z.number().int().positive().optional(),
  /** Largest page a caller may request. */
  maxPageSize: z.number().int().positive().optional(),
};

export interface PageSizeOptions {
  defaultPageSize?: number;
  maxPageSize?: number;
}

/**
 * Builds the `take` argument for an offset-paginated surface.
 *
 * Relay connections get these limits from Pothos, but offset surfaces have no
 * such support, so the ceiling is enforced by the arg's own validator.
 *
 * @param maxPageSize - Largest page a caller may request, if capped.
 * @returns The fragment to assign to the `take` arg.
 */
export function buildTakeArgFragment(maxPageSize?: number): TsCodeFragment {
  const zFragment = TsCodeUtils.importFragment('z', 'zod');
  const validator =
    maxPageSize === undefined
      ? tsTemplate`${zFragment}.int().min(0)`
      : tsTemplate`${zFragment}.int().min(0).max(${maxPageSize.toString()})`;
  return tsTemplate`t.arg.int({ validate: ${validator} })`;
}

/**
 * Builds the value assigned to Prisma's `take`.
 *
 * A cap alone is bypassed by omitting the argument entirely, so a default page
 * size is what actually bounds the query; without one the surface stays
 * unbounded.
 *
 * @param argExpression - Expression holding the caller's requested size.
 * @param defaultPageSize - Size applied when the caller supplies none.
 * @returns The expression to assign to `take`.
 */
export function buildTakeValue(
  argExpression: string,
  defaultPageSize?: number,
): string {
  return `${argExpression} ?? ${defaultPageSize?.toString() ?? 'undefined'}`;
}
