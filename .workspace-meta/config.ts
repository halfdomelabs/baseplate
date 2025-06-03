import type { PackageJson } from 'workspace-meta';

import { isEqual, merge } from 'es-toolkit';
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

function isPluginPackage(packageJson: PackageJson): boolean {
  return packageJson.name?.startsWith('@baseplate-dev/plugin-') ?? false;
}

// False positives for the Typescript project references
const IGNORED_PACKAGES = new Set([
  '@baseplate-dev/project-builder-web',
  '@baseplate-dev/root',
]);

interface TsconfigBuild {
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
}

export default defineWorkspaceMetaConfig({
  includeRootPackage: true,
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

        if (packageJson.scripts?.build) {
          const hasTemplatesFolder =
            packageJson.files?.includes('templates/**/*');
          packageJson.files = [
            'README.md',
            'LICENSE',
            'CHANGELOG',
            'dist/**/*',
            '!dist/**/*.d.ts.map',
            '!dist/**/*.tsbuildinfo',
          ];

          // If we have a templates directory, make sure we keep it
          if (hasTemplatesFolder) {
            packageJson.files.push('templates/**/*');
          }

          // If we have a bin, make sure we add it
          if (packageJson.bin) {
            packageJson.files.push('bin/**/*');
          }

          if (isPluginPackage(packageJson))
            packageJson.files.push('manifest.json');
        }
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
        .filter((name) => !IGNORED_PACKAGES.has(name))
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
            const relativePath = path.join(
              path.relative(ctx.packagePath, packageInfo.path),
              'tsconfig.build.json',
            );
            return relativePath.startsWith('.')
              ? relativePath
              : `./${relativePath}`;
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

      const parsedTsconfig = JSON.parse(tsconfigBuild) as TsconfigBuild;

      const targetConfig: TsconfigBuild = {
        compilerOptions: {
          tsBuildInfoFile: './dist/tsconfig.build.tsbuildinfo',
          composite: true,
          incremental: true,
          rootDir: 'src',
          outDir: 'dist',
        },
        references: projectReferences,
      };

      if (isRootPackage) {
        targetConfig.compilerOptions = undefined;
      }

      if (
        isMatch(parsedTsconfig.compilerOptions, targetConfig.compilerOptions) &&
        isEqual(parsedTsconfig.references, targetConfig.references)
      ) {
        return;
      }

      parsedTsconfig.references = targetConfig.references;
      parsedTsconfig.compilerOptions ??= {};
      if (targetConfig.compilerOptions) {
        merge(parsedTsconfig.compilerOptions, targetConfig.compilerOptions);
      }

      await ctx.writeFile(
        'tsconfig.build.json',
        JSON.stringify(parsedTsconfig, null, 2),
      );
    },
  ],
});
