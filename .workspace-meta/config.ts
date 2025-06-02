import type { PackageJson } from 'workspace-meta';

import { merge } from 'es-toolkit';
import { isMatch } from 'es-toolkit/compat';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  defineWorkspaceMetaConfig,
  ensureFile,
  ensurePackageJson,
  prettierFormatter,
} from 'workspace-meta';

function getProjectJsonDependencyKeys(packageJson: PackageJson): string[] {
  return [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];
}

export default defineWorkspaceMetaConfig({
  formatter: (content, filename) => {
    if (filename.endsWith('LICENSE')) {
      return content;
    }

    return prettierFormatter(content, filename);
  },
  plugins: [
    ensureFile(
      'LICENSE',
      readFileSync(
        path.join(import.meta.dirname, 'templates', 'LICENSE'),
        'utf8',
      ),
    ),
    ensurePackageJson((packageJson) => {
      packageJson.author = 'Half Dome Labs LLC';
      packageJson.license = 'MPL-2.0';
      packageJson.homepage = 'https://www.baseplate.dev';

      if (!packageJson.private) {
        packageJson.publishConfig = {
          access: 'public',
          provenance: true,
        } as { access: 'public' };
      }

      return packageJson;
    }),
    // attach project references for tsconfig.build.json
    async (ctx) => {
      const dependencies = getProjectJsonDependencyKeys(ctx.packageJson);

      if (!dependencies.includes('typescript')) {
        return;
      }

      const isRootPackage = ctx.packagePath === ctx.workspacePath;

      const projectDependencyNames = isRootPackage
        ? ctx.workspacePackages.map((p) => p.name)
        : getProjectJsonDependencyKeys(ctx.packageJson);

      const interProjectDependencies = projectDependencyNames
        .map((name) => {
          const packageInfo = ctx.workspacePackages.find(
            (p) => p.name === name,
          );
          if (!packageInfo) {
            return undefined;
          }

          if (
            getProjectJsonDependencyKeys(packageInfo.packageJson).includes(
              'typescript',
            ) &&
            Object.keys(packageInfo.packageJson.scripts ?? {}).includes('build')
          ) {
            return path.join(
              path.relative(ctx.packagePath, packageInfo.path),
              'tsconfig.build.json',
            );
          }
        })
        .filter((name) => name !== undefined)
        .toSorted();

      const projectReferences = interProjectDependencies.map((filePath) => ({
        path: filePath,
      }));

      const tsconfigBuild = await ctx.readFile('tsconfig.build.json');
      if (!tsconfigBuild) {
        return;
      }

      const parsedTsconfig = JSON.parse(tsconfigBuild) as {
        compilerOptions:
          | {
              tsBuildInfoFile?: string;
              composite?: boolean;
              incremental?: boolean;
              rootDir?: string;
              outDir?: string;
            }
          | undefined;
        references:
          | {
              path: string;
            }[]
          | undefined;
      };

      const targetConfig = {
        compilerOptions: {
          tsBuildInfoFile: './dist/tsconfig.build.tsbuildinfo',
          composite: true,
          incremental: true,
          rootDir: 'src',
          outDir: 'dist',
        },
        references: projectReferences,
      };

      if (isMatch(parsedTsconfig, targetConfig)) {
        return;
      }

      parsedTsconfig.references = targetConfig.references;
      parsedTsconfig.compilerOptions ??= {};
      merge(parsedTsconfig.compilerOptions, targetConfig.compilerOptions);

      await ctx.writeFile(
        'tsconfig.build.json',
        JSON.stringify(parsedTsconfig, null, 2),
      );
    },
  ],
});
