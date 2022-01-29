import {
  createGeneratorWithChildren,
  createProviderType,
  writeFormattedAction,
} from '@baseplate/sync';
import * as yup from 'yup';

const descriptorSchema = yup.object({
  additionalExclusions: yup.array(yup.string().required()),
});

export type NodeGitIgnoreProvider = {
  addExclusions(exclusions: string[]): void;
};

export const nodeGitIgnoreProvider =
  createProviderType<NodeGitIgnoreProvider>('node-git-ignore');

const NodeGitIgnoreGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {},
  exports: {
    nodeGitIgnore: nodeGitIgnoreProvider,
  },
  createGenerator(descriptor) {
    const exclusionLines: string[] = [
      '# See https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository#_ignoring for more about ignoring files.',
      '',
      '# dependencies',
      '/node_modules',
      '/.pnp',
      '.pnp.js',
      '',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
    ];
    return {
      getProviders: () => ({
        nodeGitIgnore: {
          addExclusions(exclusions: string[]) {
            exclusionLines.push('');
            exclusionLines.push(...exclusions);
          },
        },
      }),
      build: async (builder) => {
        if (descriptor.additionalExclusions) {
          exclusionLines.push(...descriptor.additionalExclusions);
        }
        await builder.apply(
          writeFormattedAction({
            destination: '.gitignore',
            contents: exclusionLines.join('\n'),
          })
        );
      },
    };
  },
});

export default NodeGitIgnoreGenerator;
