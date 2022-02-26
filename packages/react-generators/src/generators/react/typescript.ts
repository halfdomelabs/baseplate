import { TypescriptConfigProvider } from '@baseplate/core-generators';

export function setupReactTypescript(
  typescriptConfig: TypescriptConfigProvider
): void {
  typescriptConfig.setTypescriptVersion('4.5.4');
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
    baseUrl: './src',
    paths: {
      '@src/*': ['./*'],
    },
  });
  typescriptConfig.addInclude('src');
}
