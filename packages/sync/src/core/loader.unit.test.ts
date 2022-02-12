import { promises as fs, Dirent } from 'fs';
import * as requireUtils from '../utils/require';
import { GeneratorConfig } from './generator';
import { loadGeneratorsForModule } from './loader';

jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
  },
}));
jest.mock('../utils/require');

const mockedFs = jest.mocked(fs);
const mockedRequireUtils = jest.mocked(requireUtils);

function createMockDirEntry(options: {
  isDirectory: boolean;
  name: string;
}): Dirent {
  return {
    isDirectory: () => options.isDirectory,
    name: options.name,
  } as unknown as Dirent;
}

describe('loadGeneratorsForModule', () => {
  it('loads a set of generators from a folder', async () => {
    mockedRequireUtils.resolveModule.mockReturnValueOnce(
      '/modules/test-generators/lib'
    );
    mockedFs.readdir.mockResolvedValueOnce([
      createMockDirEntry({ isDirectory: true, name: 'generatorOne' }),
      createMockDirEntry({ isDirectory: true, name: 'generatorTwo' }),
      createMockDirEntry({ isDirectory: false, name: 'foo.yml' }),
    ]);
    const mockGeneratorOne: GeneratorConfig = {
      parseDescriptor: jest.fn(),
      createGenerator: jest.fn(),
    };
    const mockGeneratorTwo: GeneratorConfig = {
      parseDescriptor: jest.fn(),
      createGenerator: jest.fn(),
    };
    mockedRequireUtils.getModuleDefault.mockReturnValueOnce(mockGeneratorOne);
    mockedRequireUtils.getModuleDefault.mockReturnValueOnce(mockGeneratorTwo);

    const generator = await loadGeneratorsForModule(
      '@baseplate/test-generators'
    );

    expect(generator).toEqual({
      '@baseplate/test/generatorOne': {
        ...mockGeneratorOne,
        configBaseDirectory: '/modules/test-generators/generators/generatorOne',
      },
      '@baseplate/test/generatorTwo': {
        ...mockGeneratorTwo,
        configBaseDirectory: '/modules/test-generators/generators/generatorTwo',
      },
    });

    expect(mockedRequireUtils.resolveModule).toHaveBeenCalledWith(
      '@baseplate/test-generators'
    );
    expect(mockedFs.readdir).toHaveBeenCalledWith(
      '/modules/test-generators/generators',
      { withFileTypes: true }
    );
    expect(mockedRequireUtils.getModuleDefault).toHaveBeenCalledWith(
      '/modules/test-generators/generators/generatorOne'
    );
    expect(mockedRequireUtils.getModuleDefault).toHaveBeenCalledWith(
      '/modules/test-generators/generators/generatorTwo'
    );
  });
});
