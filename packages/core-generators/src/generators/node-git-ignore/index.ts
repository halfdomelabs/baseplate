import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  writeFileAction,
} from '@baseplate/sync';
import * as yup from 'yup';

interface NodeGitIgnoreDescriptor extends GeneratorDescriptor {
  additionalExclusions: string[];
}

const descriptorSchema = {
  additionalExclusions: yup.array(yup.string()),
};

export type NodeGitIgnoreProvider = {
  addExclusions(exclusions: string[]): void;
};

export const nodeGitIgnoreProvider = createProviderType<NodeGitIgnoreProvider>(
  'node-git-ignore'
);

const NodeGitIgnoreGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<NodeGitIgnoreDescriptor>(
    descriptorSchema
  ),
  dependsOn: {},
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
      getProviders: () => {
        return {
          nodeGitIgnore: {
            addExclusions(exclusions: string[]) {
              exclusionLines.push('');
              exclusionLines.push(...exclusions);
            },
          },
        };
      },
      build: (context) => {
        if (descriptor.additionalExclusions) {
          exclusionLines.push(...descriptor.additionalExclusions);
        }
        context.addAction(
          writeFileAction({
            destination: '.gitignore',
            contents: exclusionLines.join('\n'),
          })
        );
      },
    };
  },
});

export default NodeGitIgnoreGenerator;
