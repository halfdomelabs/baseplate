import type { Ora } from 'ora';

import { vol } from 'memfs';
import ora from 'ora';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateBaseplateProject } from './project-creator.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    isSpinning: false,
  })),
}));

vi.mock('./exec.js', () => ({
  exec: vi.fn(() => Promise.resolve()),
}));

vi.mock('chalk', () => ({
  default: {
    bold: (text: string) => text,
  },
}));

describe('generateBaseplateProject', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let spinnerMock: {
    start: ReturnType<typeof vi.fn>;
    succeed: ReturnType<typeof vi.fn>;
    fail: ReturnType<typeof vi.fn>;
    isSpinning: boolean;
  };
  const oraMock = vi.mocked(ora);

  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
    consoleInfoSpy = vi
      .spyOn(console, 'info')
      .mockImplementation(() => undefined);

    // Setup ora mock
    spinnerMock = {
      start: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      isSpinning: false,
    };
    oraMock.mockReturnValue(spinnerMock as unknown as Ora);

    // Mock template files
    const templateDir = new URL('../templates/', import.meta.url).pathname;
    vol.mkdirSync(templateDir, { recursive: true });
    vol.writeFileSync(`${templateDir}.gitignore`, '# gitignore content');
    vol.writeFileSync(`${templateDir}.template.npmrc`, 'npmrc content');
    vol.writeFileSync(`${templateDir}README.md`, '# README content');
  });

  afterEach(() => {
    vol.reset();
    consoleInfoSpy.mockRestore();
  });

  it('creates project directory and files successfully', async () => {
    const packageName = 'test-project';
    const directory = '/test-dir';
    const cliVersion = '1.0.0';

    await generateBaseplateProject({
      packageName,
      directory,
      cliVersion,
    });

    // Check directory was created
    expect(vol.existsSync(directory)).toBe(true);

    // Check package.json was created with correct content
    const packageJsonContent = vol.readFileSync(
      `${directory}/package.json`,
      'utf8',
    );
    const packageJson = JSON.parse(packageJsonContent as string) as Record<
      string,
      unknown
    >;
    expect(packageJson).toMatchObject({
      name: packageName,
      version: '0.1.0',
      private: true,
      description: 'A Baseplate project',
      license: 'UNLICENSED',
      author: '<AUTHOR>',
      scripts: {
        'baseplate:serve': 'baseplate serve',
        'baseplate:generate': 'baseplate generate',
        preinstall: 'npx only-allow pnpm',
      },
      devDependencies: {
        '@baseplate-dev/project-builder-cli': cliVersion,
      },
      packageManager: 'pnpm@10.15.0',
      engines: {
        node: '^22.0.0',
        pnpm: '^10.15.0',
      },
      volta: {
        node: '22.18.0',
      },
    });

    // Check other files were copied
    expect(vol.existsSync(`${directory}/.gitignore`)).toBe(true);
    expect(vol.readFileSync(`${directory}/.gitignore`, 'utf8')).toBe(
      '# gitignore content',
    );

    expect(vol.existsSync(`${directory}/.npmrc`)).toBe(true);
    expect(vol.readFileSync(`${directory}/.npmrc`, 'utf8')).toBe(
      'npmrc content',
    );

    expect(vol.existsSync(`${directory}/README.md`)).toBe(true);
    expect(vol.readFileSync(`${directory}/README.md`, 'utf8')).toBe(
      '# README content',
    );
  });

  it('creates nested directories if they do not exist', async () => {
    const packageName = 'nested-project';
    const directory = '/nested/path/to/project';
    const cliVersion = '2.0.0';

    await generateBaseplateProject({
      packageName,
      directory,
      cliVersion,
    });

    expect(vol.existsSync(directory)).toBe(true);
    expect(vol.existsSync(`${directory}/package.json`)).toBe(true);
  });

  it('shows correct spinner messages', async () => {
    await generateBaseplateProject({
      packageName: 'test-project',
      directory: '/test-dir',
      cliVersion: '1.0.0',
    });

    // Check ora was called with correct messages
    expect(oraMock).toHaveBeenCalledWith({
      text: 'Creating project files...',
    });

    // Check spinner lifecycle for the first spinner
    expect(spinnerMock.start).toHaveBeenCalled();
    expect(spinnerMock.succeed).toHaveBeenCalled();
  });

  it('runs pnpm install in the correct directory', async () => {
    const { exec } = await import('./exec.js');
    const mockedExec = vi.mocked(exec);
    const directory = '/test-dir';

    await generateBaseplateProject({
      packageName: 'test-project',
      directory,
      cliVersion: '1.0.0',
    });

    expect(mockedExec).toHaveBeenCalledWith('pnpm install', directory);
  });

  it('displays success message with relative path', async () => {
    const originalCwd = process.cwd();
    vi.spyOn(process, 'cwd').mockReturnValue('/current');

    await generateBaseplateProject({
      packageName: 'test-project',
      directory: '/current/test-dir',
      cliVersion: '1.0.0',
    });

    expect(consoleInfoSpy).toHaveBeenCalledWith('');
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('🎉 Congratulations!'),
    );
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('cd test-dir'),
    );
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('pnpm baseplate serve'),
    );

    vi.spyOn(process, 'cwd').mockReturnValue(originalCwd);
  });

  it('displays success message without cd command when in project directory', async () => {
    const directory = process.cwd();

    await generateBaseplateProject({
      packageName: 'test-project',
      directory,
      cliVersion: '1.0.0',
    });

    const successMessage = consoleInfoSpy.mock.calls
      .map((call) => call[0])
      .find(
        (msg) => typeof msg === 'string' && msg.includes('🎉 Congratulations!'),
      );

    expect(successMessage).toBeDefined();
    expect(successMessage).not.toContain('cd ');
    expect(successMessage).toContain('pnpm baseplate serve');
  });

  it('handles errors gracefully and fails spinner', async () => {
    const directory = '/test-dir';

    // Make fs.mkdir throw an error
    vol.mkdirSync(directory, { recursive: true });
    vol.writeFileSync(`${directory}/package.json`, 'existing file');
    // Make the directory read-only to cause an error
    vol.chmodSync(directory, '444');

    spinnerMock.isSpinning = true;

    await expect(
      generateBaseplateProject({
        packageName: 'test-project',
        directory: `${directory}/subdir`,
        cliVersion: '1.0.0',
      }),
    ).rejects.toThrow();

    expect(spinnerMock.fail).toHaveBeenCalled();
  });
});
