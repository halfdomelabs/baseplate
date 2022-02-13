import { TypescriptProvider } from '@baseplate/core-generators';

export function setupReactTypescript(typescript: TypescriptProvider): void {
  typescript.setTypescriptVersion('4.5.4');
  typescript.setTypescriptCompilerOptions({
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
  typescript.addInclude('src');
}
