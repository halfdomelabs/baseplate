import { TypescriptProvider } from '../typescript';

export function setupReactTypescript(typescript: TypescriptProvider): void {
  typescript.setTypescriptVersion('4.0.3');
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
    jsx: 'react',
    baseUrl: 'src',
  });
  typescript.addInclude('src');
}
