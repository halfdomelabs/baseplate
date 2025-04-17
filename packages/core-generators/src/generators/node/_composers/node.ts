import type {
  GeneratorBundle,
  InferDescriptorFromGenerator,
} from '@halfdomelabs/sync';

import { eslintGenerator } from '../eslint/eslint.generator.js';
import { nodeGitIgnoreGenerator } from '../node-git-ignore/node-git-ignore.generator.js';
import { nodeGenerator } from '../node/node.generator.js';
import { prettierGenerator } from '../prettier/prettier.generator.js';
import { tsUtilsGenerator } from '../ts-utils/ts-utils.generator.js';
import { typescriptGenerator } from '../typescript/typescript.generator.js';

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
