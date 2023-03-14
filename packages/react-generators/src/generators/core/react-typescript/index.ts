import { typescriptConfigProvider } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

const ReactTypescriptGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescriptConfig: typescriptConfigProvider,
  },
  createGenerator(descriptor, { typescriptConfig }) {
    typescriptConfig.setTypescriptVersion('4.8.4');
    typescriptConfig.setTypescriptCompilerOptions({
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noFallthroughCasesInSwitch: true,
      module: 'esnext',
      moduleResolution: 'node',
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      baseUrl: './',
    });
    typescriptConfig.addInclude('src');
    return {
      build: async () => {},
    };
  },
});

export default ReactTypescriptGenerator;
