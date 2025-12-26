import type { Ora } from 'ora';

import ora from 'ora';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateBaseplateProject } from './project-creator.js';

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    isSpinning: false,
  })),
}));

vi.mock('chalk', () => ({
  default: {
    bold: (text: string) => text,
  },
}));

// Mock the project generator module
vi.mock('./project-generator.js', () => ({
  generateRootPackage: vi.fn(() => Promise.resolve()),
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
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  it('calls generateRootPackage with correct config', async () => {
    const { generateRootPackage } = await import('./project-generator.js');
    const mockedGenerateRootPackage = vi.mocked(generateRootPackage);

    const packageName = 'test-project';
    const directory = '/test-dir';
    const cliVersion = '1.0.0';

    await generateBaseplateProject({
      packageName,
      directory,
      cliVersion,
    });

    expect(mockedGenerateRootPackage).toHaveBeenCalledWith({
      name: packageName,
      cliVersion,
      directory,
    });
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

    // Check spinner lifecycle
    expect(spinnerMock.start).toHaveBeenCalled();
    expect(spinnerMock.succeed).toHaveBeenCalled();
  });

  it('displays success message with relative path', async () => {
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

    vi.restoreAllMocks();
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
    const { generateRootPackage } = await import('./project-generator.js');
    const mockedGenerateRootPackage = vi.mocked(generateRootPackage);

    // Make generateRootPackage throw an error
    mockedGenerateRootPackage.mockRejectedValueOnce(
      new Error('Sync engine error'),
    );

    spinnerMock.isSpinning = true;

    await expect(
      generateBaseplateProject({
        packageName: 'test-project',
        directory: '/test-dir',
        cliVersion: '1.0.0',
      }),
    ).rejects.toThrow('Sync engine error');

    expect(spinnerMock.fail).toHaveBeenCalled();
  });
});
