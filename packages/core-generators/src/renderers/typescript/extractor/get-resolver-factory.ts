import { existsSync } from 'node:fs';
import path from 'node:path';
import { ResolverFactory } from 'oxc-resolver';

/**
 * Get a resolver factory for the given working directory.
 * @param workingDirectory - The working directory to use for the resolver factory.
 * @returns A resolver factory for the given working directory.
 */
export function getResolverFactory(workingDirectory: string): ResolverFactory {
  // Slight hack to support tsconfig.app.json instead of tsconfig.json
  const tsconfigAppExists = existsSync(
    path.join(workingDirectory, 'tsconfig.app.json'),
  );
  const tsconfigPath = tsconfigAppExists
    ? path.join(workingDirectory, 'tsconfig.app.json')
    : path.join(workingDirectory, 'tsconfig.json');
  return new ResolverFactory({
    tsconfig: {
      configFile: tsconfigPath,
    },
    conditionNames: ['node', 'require', 'types'],
    extensions: ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.json', '.node'],
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.d.ts', '.js'],
      '.jsx': ['.tsx', '.d.ts', '.jsx'],
      '.cjs': ['.cts', '.d.cts', '.cjs'],
      '.mjs': ['.mts', '.d.mts', '.mjs'],
    },
  });
}
