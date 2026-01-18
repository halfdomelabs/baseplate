import type { FragmentMatchers } from '@baseplate-dev/core-generators/test-helpers';

import {
  extendFragmentMatchers,
  extendFragmentSerializer,
} from '@baseplate-dev/core-generators/test-helpers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Matchers<T = any> extends FragmentMatchers<T> {}
}

extendFragmentMatchers();
extendFragmentSerializer();
