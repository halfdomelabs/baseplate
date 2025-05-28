// @ts-nocheck

import { foo } from '@src/utils';
import type { Bar } from '@src/types';
import { baz } from '@src/other';

export { qux } from '@src/more';
export type { Quux } from '@src/types';

function test() {
  foo();
  baz();
}
