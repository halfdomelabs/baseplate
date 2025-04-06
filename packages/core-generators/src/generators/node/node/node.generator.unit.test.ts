import { createTaskTestRunner } from '@halfdomelabs/sync';
import { describe, expect, it } from 'vitest';

import { NODE_VERSION, PNPM_VERSION } from '@src/constants/node.js';

import { nodeGenerator } from './node.generator.js';

describe('nodeGenerator', () => {
  describe('projectTask', () => {
    const nodeBundle = nodeGenerator({
      name: 'node-project',
    });

    it('returns the project name', async () => {
      const runner = createTaskTestRunner(nodeBundle.tasks.project);
      const result = await runner.run({});
      expect(result.outputs.project.getProjectName()).toBe('node-project');
    });
  });

  describe('mainTask', () => {
    it('generates package.json with default values', async () => {
      const nodeBundle = nodeGenerator({
        name: 'test-project',
      });

      const runner = createTaskTestRunner(nodeBundle.tasks.main);
      const result = await runner.run({
        nodeConfigValues: { isEsm: false },
      });

      // Check the nodeProvider
      expect(result.exports.node).toMatchObject({
        isEsm: false,
        nodeVersion: NODE_VERSION,
      });

      // Check the generated package.json
      const packageJsonOutput = result.getFileOutputContents('package.json');
      expect(packageJsonOutput).toBeDefined();

      const packageJson = JSON.parse(packageJsonOutput ?? '') as unknown;
      expect(packageJson).toMatchObject({
        name: 'test-project',
        version: '0.1.0',
        license: 'UNLICENSED',
        private: true,
        type: 'commonjs',
        engines: {
          node: `^${NODE_VERSION}`,
          pnpm: `^${PNPM_VERSION.split('.').slice(0, 2).join('.')}.0`,
        },
        scripts: {
          preinstall: 'npx only-allow pnpm',
        },
      });
    });

    it('generates package.json with custom values', async () => {
      const customNodeVersion = '18.16.0';
      const customPnpmVersion = '8.5.0';

      const nodeBundle = nodeGenerator({
        name: 'custom-project',
        packageName: '@org/custom-package',
        description: 'A custom Node.js project',
        license: 'MIT',
        version: '1.2.3',
        private: false,
        nodeVersion: customNodeVersion,
        pnpmVersion: customPnpmVersion,
      });

      const runner = createTaskTestRunner(nodeBundle.tasks.main);
      const result = await runner.run({
        nodeConfigValues: { isEsm: true },
      });

      // Check the nodeProvider
      expect(result.exports.node).toMatchObject({
        isEsm: true,
        nodeVersion: customNodeVersion,
      });

      // Check the generated package.json
      const packageJsonOutput = result.getFileOutputContents('package.json');
      expect(packageJsonOutput).toBeDefined();

      const packageJson = JSON.parse(packageJsonOutput ?? '') as unknown;
      expect(packageJson).toMatchObject({
        name: '@org/custom-package',
        description: 'A custom Node.js project',
        version: '1.2.3',
        license: 'MIT',
        private: false,
        type: 'module',
        engines: {
          node: `^${customNodeVersion}`,
          pnpm: `^${customPnpmVersion.split('.').slice(0, 2).join('.')}.0`,
        },
      });
    });

    it('adds a post-write command for package installation', async () => {
      const nodeBundle = nodeGenerator({
        name: 'package-install-test',
      });

      const runner = createTaskTestRunner(nodeBundle.tasks.main);
      const result = await runner.run({
        nodeConfigValues: { isEsm: false },
      });

      // Check for post-write command
      const installCommand = result.getPostWriteCommand('pnpm install');
      expect(installCommand).toMatchObject({
        command: 'pnpm install',
        options: {
          workingDirectory: '/',
          onlyIfChanged: ['package.json'],
        },
      });
    });
  });

  describe('nodeProvider', () => {
    it('adds packages to node provider', async () => {
      const nodeBundle = nodeGenerator({
        name: 'packages-test',
      });

      // First run the main task to get the node provider
      const mainRunner = createTaskTestRunner(nodeBundle.tasks.main);
      const mainResult = await mainRunner.run(
        {
          nodeConfigValues: { isEsm: false },
        },
        ({ node }) => {
          node.packages.addPackages({
            prod: {
              express: '^4.18.2',
              dotenv: '^16.0.3',
            },
            dev: {
              typescript: '^5.0.0',
              vitest: '^0.30.1',
            },
          });
        },
      );

      // Check the generated package.json after adding packages
      const packageJsonOutput =
        mainResult.getFileOutputContents('package.json');
      expect(packageJsonOutput).toBeDefined();

      const packageJson = JSON.parse(packageJsonOutput ?? '') as unknown;
      expect(packageJson).toMatchObject({
        dependencies: {
          express: '^4.18.2',
          dotenv: '^16.0.3',
        },
        devDependencies: {
          typescript: '^5.0.0',
          vitest: '^0.30.1',
        },
      });
    });
  });
});
