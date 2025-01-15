import type {
  GeneratorBundle,
  InferDescriptorFromGenerator,
} from '@halfdomelabs/sync';

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
      ...descriptor.children,
    },
  });
