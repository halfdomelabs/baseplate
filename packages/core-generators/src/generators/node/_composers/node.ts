import type {
  GeneratorBundle,
  InferDescriptorFromGenerator,
} from '@baseplate-dev/sync';

import { pathRootsGenerator } from '#src/generators/metadata/path-roots/index.js';

import { eslintGenerator } from '../eslint/index.js';
import { nodeGitIgnoreGenerator } from '../node-git-ignore/index.js';
import { nodeGenerator } from '../node/index.js';
import { prettierGenerator } from '../prettier/index.js';
import { tsUtilsGenerator } from '../ts-utils/index.js';
import { typescriptGenerator } from '../typescript/index.js';

export const composeNodeGenerator = (
  descriptor: InferDescriptorFromGenerator<typeof nodeGenerator>,
): GeneratorBundle =>
  nodeGenerator({
    ...descriptor,
    children: {
      prettier: prettierGenerator({}),
      typescript: typescriptGenerator({}),
      gitIgnore: nodeGitIgnoreGenerator({}),
      eslint: eslintGenerator({}),
      tsUtils: tsUtilsGenerator({}),
      pathRoots: pathRootsGenerator({}),
      ...descriptor.children,
    },
  });
