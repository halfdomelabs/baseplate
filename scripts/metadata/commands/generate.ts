import { confirm, input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import * as fs from 'node:fs';
import path from 'node:path';

import type { GeneratePackageOptions } from '../config/types.js';
import type { PackageJson } from '../types.js';
import type { PackageInfo } from '../utils/workspace.js';

import {
  getPackageJsonTemplate,
  getRequiredDevDependencies,
  getRequiredScripts,
  METAFILES,
} from '../metafiles/index.js';
import { ensureDir, writeTextFile } from '../utils/file-operations.js';
import { formatContent, formatJson } from '../utils/formatter.js';

export interface GenerateOptions {
  plugin?: boolean;
  library?: boolean;
}

export async function generateCommand(
  options: GenerateOptions = {},
): Promise<void> {
  console.info(chalk.bold('\nGenerate new package\n'));

  // Determine package type
  let packageType: 'plugin' | 'library' | 'app';
  if (options.plugin) {
    packageType = 'plugin';
  } else if (options.library) {
    packageType = 'library';
  } else {
    packageType = await select({
      message: 'What type of package?',
      choices: [
        { name: 'Library', value: 'library' },
        { name: 'Plugin', value: 'plugin' },
        { name: 'Application', value: 'app' },
      ],
    });
  }

  // Get package name
  const name = await input({
    message: 'Package name:',
    validate: (value) => {
      if (!value) return 'Package name is required';
      if (!/^[a-z0-9-]+$/.test(value)) {
        return 'Package name must be lowercase with hyphens only';
      }
      return true;
    },
  });

  // Get description
  const description = await input({
    message: 'Description:',
    default: '',
  });

  // Ask about React
  const useReact = await confirm({
    message: 'Will this package use React?',
    default: packageType === 'app',
  });

  // Ask about TypeScript (always yes for consistency)
  const useTypeScript = true;

  // Determine directory
  const baseDir = packageType === 'plugin' ? 'plugins' : 'packages';
  const packageDir = path.join(process.cwd(), baseDir, name);

  // Check if directory exists
  if (fs.existsSync(packageDir)) {
    console.error(chalk.red(`\nError: Directory ${packageDir} already exists`));
    throw new Error(`Directory ${packageDir} already exists`);
  }

  // Create package options
  const generateOptions: GeneratePackageOptions = {
    name,
    description,
    packageType,
    useReact,
    useTypeScript,
  };

  // Create package
  console.info(chalk.blue(`\nCreating package at ${packageDir}...`));

  // Create directory structure
  ensureDir(packageDir);
  ensureDir(path.join(packageDir, 'src'));

  // Create package.json first
  const packageJson = await createPackageJson(generateOptions);
  const packageJsonPath = path.join(packageDir, 'package.json');
  const formattedJson = await formatJson(packageJson);
  writeTextFile(packageJsonPath, formattedJson);
  console.info(chalk.green('  ✓ Created package.json'));

  // Create mock PackageInfo for metafile generation
  const mockPkg: PackageInfo = {
    name: packageJson.name,
    path: packageDir,
    packageJsonPath,
    packageJson,
    isPlugin: packageType === 'plugin',
    isReactPackage: useReact,
  };

  // Create all metafiles using the centralized config
  for (const metafile of METAFILES) {
    if (metafile.fileName === 'package.json') {
      // Already created
      continue;
    }

    if (!metafile.shouldExist(mockPkg)) {
      continue;
    }

    const filePath = path.join(packageDir, metafile.fileName);
    const content = metafile.getContent(mockPkg);
    let contentString: string;

    if (typeof content === 'object') {
      contentString = metafile.format
        ? await formatJson(content)
        : `${JSON.stringify(content, null, 2)}\n`;
    } else {
      contentString = metafile.format
        ? await formatContent(content, filePath)
        : content;
    }

    writeTextFile(filePath, contentString);
    console.log(chalk.green(`  ✓ Created ${metafile.fileName}`));
  }

  // Create TypeScript config files
  if (useTypeScript) {
    await createTsConfig(packageDir, packageType, useReact);
    console.log(chalk.green('  ✓ Created TypeScript config files'));
  }

  // Create index file
  const indexPath = path.join(
    packageDir,
    'src',
    useTypeScript ? 'index.ts' : 'index.js',
  );
  writeTextFile(indexPath, `// ${name}\n\nexport {};\n`);
  console.log(chalk.green('  ✓ Created src/index file'));

  // Create README
  await createReadme(packageDir, name, description);
  console.log(chalk.green('  ✓ Created README.md'));

  // Plugin-specific files
  if (packageType === 'plugin') {
    await createPluginFiles(packageDir, name);
    console.log(chalk.green('  ✓ Created plugin-specific files'));
  }

  console.log(chalk.bold.green(`\n✓ Package created successfully!\n`));
  console.log(chalk.yellow('Next steps:'));
  console.log(`  1. cd ${packageDir}`);
  console.log(`  2. pnpm install`);
  console.log(`  3. Start coding! 🚀\n`);
}

async function createPackageJson(
  options: GeneratePackageOptions,
): Promise<PackageJson> {
  const { name, description, packageType, useReact, useTypeScript } = options;

  // Create mock package info for template generation
  const mockPkg: PackageInfo = {
    name,
    path: '',
    packageJsonPath: '',
    packageJson: {},
    isPlugin: packageType === 'plugin',
    isReactPackage: useReact,
  };

  const template = getPackageJsonTemplate(mockPkg);
  const scripts = getRequiredScripts(mockPkg);
  const devDependencies = getRequiredDevDependencies(mockPkg);

  const packageJson: PackageJson = {
    name:
      packageType === 'plugin'
        ? `baseplate-plugin-${name}`
        : `@baseplate/${name}`,
    version: '0.0.0',
    type: 'module',
    description,
    ...template,
    main: useTypeScript ? './dist/index.js' : './src/index.js',
    types: useTypeScript ? './dist/index.d.ts' : undefined,
    exports: {
      '.': useTypeScript ? './dist/index.js' : './src/index.js',
    },
    files: useTypeScript ? ['dist'] : ['src'],
    scripts,
    dependencies: {},
    devDependencies: {
      ...devDependencies,
      '@baseplate/tools': 'workspace:*',
      ...(useTypeScript ? { typescript: '^5.3.3' } : {}),
      ...(useReact
        ? {
            '@types/react': '^18.3.3',
            '@types/react-dom': '^18.3.0',
          }
        : {}),
    },
    ...(useReact
      ? {
          peerDependencies: {
            react: '>=18',
            'react-dom': '>=18',
          },
        }
      : {}),
  };

  // Plugin-specific additions
  if (packageType === 'plugin') {
    packageJson.devDependencies.vite = '^5.4.0';
    packageJson.devDependencies['@vitejs/plugin-react'] = '^4.3.1';
  }

  // Remove undefined values
  for (const key of Object.keys(packageJson)) {
    if (packageJson[key] === undefined) {
      delete packageJson[key];
    }
  }

  return packageJson;
}

async function createTsConfig(
  packageDir: string,
  packageType: string,
  useReact: boolean,
): Promise<void> {
  const baseConfig = {
    extends: '@baseplate/tools/node-tsconfig',
    compilerOptions: {
      rootDir: 'src',
      outDir: 'dist',
      ...(useReact ? { jsx: 'react-jsx' } : {}),
    },
    include: ['src'],
  };

  const tsconfigPath = path.join(packageDir, 'tsconfig.json');
  writeTextFile(tsconfigPath, await formatJson(baseConfig));

  // Create tsconfig.build.json
  const buildConfig = {
    extends: './tsconfig.json',
    exclude: ['**/*.test.ts', '**/*.unit.test.ts', '**/*.int.test.ts'],
  };

  const buildPath = path.join(packageDir, 'tsconfig.build.json');
  writeTextFile(buildPath, await formatJson(buildConfig));

  // Plugin-specific tsconfig.node.json
  if (packageType === 'plugin') {
    const nodeConfig = {
      extends: '@baseplate/tools/node-tsconfig',
      include: ['vite.config.ts'],
    };
    const nodePath = path.join(packageDir, 'tsconfig.node.json');
    writeTextFile(nodePath, await formatJson(nodeConfig));
  }
}

async function createReadme(
  packageDir: string,
  name: string,
  description: string,
): Promise<void> {
  const content = `# ${name}

${description || 'TODO: Add description'}

## Installation

\`\`\`bash
pnpm add ${name}
\`\`\`

## Usage

TODO: Add usage instructions

## Development

\`\`\`bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Lint
pnpm lint
\`\`\`
`;

  const readmePath = path.join(packageDir, 'README.md');
  writeTextFile(readmePath, await formatContent(content, readmePath));
}

async function createPluginFiles(
  packageDir: string,
  name: string,
): Promise<void> {
  // Create manifest.json
  const manifest = {
    name: `baseplate-plugin-${name}`,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    description: 'TODO: Add description',
    version: '0.0.0',
  };

  const manifestPath = path.join(packageDir, 'manifest.json');
  writeTextFile(manifestPath, await formatJson(manifest));

  // Create vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
});
`;

  const vitePath = path.join(packageDir, 'vite.config.ts');
  writeTextFile(vitePath, await formatContent(viteConfig, vitePath));

  // Create index.html for dev
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name} Plugin Dev</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.ts"></script>
  </body>
</html>
`;

  const htmlPath = path.join(packageDir, 'index.html');
  writeTextFile(htmlPath, await formatContent(indexHtml, htmlPath));
}
