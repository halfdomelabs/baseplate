import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';

/**
 * Builds the `where: t.arg({ type, validate })` fragment shared by the
 * list/count/connection query generators: the WhereInput type reference plus
 * a `validate` call that rejects overly deep or wide filters.
 */
export function buildWhereArgFragment(options: {
  whereInputTypeReference: TsCodeFragment;
  validatorFragment: TsCodeFragment;
  maxDepth: number;
  maxClauseCount: number;
}): TsCodeFragment {
  const {
    whereInputTypeReference,
    validatorFragment,
    maxDepth,
    maxClauseCount,
  } = options;
  const zFragment = TsCodeUtils.importFragment('z', 'zod');

  return tsTemplate`t.arg({
    type: ${whereInputTypeReference},
    validate: ${zFragment}.custom((where) => ${validatorFragment}(where, ${maxDepth.toString()}, ${maxClauseCount.toString()}), {
      message: 'where filter is too deeply nested or has too many clauses',
    }),
  })`;
}

/**
 * The `, where ?? undefined` fragment appended to a policy's `.where(ctx)`
 * call when a `where` arg is present — empty string otherwise, so the call
 * site can splice it in unconditionally.
 */
export function getCallerWhereArg(hasWhereInput: boolean): string {
  return hasWhereInput ? ', where ?? undefined' : '';
}
