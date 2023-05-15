import { vol } from 'memfs';
import * as requireUtils from '../utils/require';
import { GeneratorConfig } from './generator';
import { loadGeneratorsForModule } from './loader';

jest.mock('fs');
jest.mock('../utils/require');

const mockedRequireUtils = jest.mocked(requireUtils);

beforeEach(() => {
  vol.reset();
});

describe('loadGeneratorsForModule', () => {
  it('loads a set of generators from a folder', async () => {
    mockedRequireUtils.resolveModule.mockReturnValueOnce(
      '/modules/test-generators/package.json'
    );
    vol.fromJSON(
      {
        '/modules/test-generators/lib/generators/generatorOne/index.ts': 'a();',
        '/modules/test-generators/lib/generators/generatorTwo/index.ts': 'a();',
        '/modules/test-generators/lib/generators/_ignored/index.ts': 'a();',
        '/modules/test-generators/lib/generators/index.ts': 'a();',
        '/modules/test-generators/lib/random/foo.yml': 'test',
      },
      '/modules/test-generators'
    );
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
      '@halfdomelabs/test-generators'
    );

    expect(generator).toEqual({
      '@halfdomelabs/test/generatorOne': {
        ...mockGeneratorOne,
        configBaseDirectory:
          '/modules/test-generators/lib/generators/generatorOne',
      },
      '@halfdomelabs/test/generatorTwo': {
        ...mockGeneratorTwo,
        configBaseDirectory:
          '/modules/test-generators/lib/generators/generatorTwo',
      },
    });

    expect(mockedRequireUtils.resolveModule).toHaveBeenCalledWith(
      '@halfdomelabs/test-generators/package.json'
    );
    expect(mockedRequireUtils.getModuleDefault).toHaveBeenCalledWith(
      '/modules/test-generators/lib/generators/generatorOne'
    );
    expect(mockedRequireUtils.getModuleDefault).toHaveBeenCalledWith(
      '/modules/test-generators/lib/generators/generatorTwo'
    );
  });

  it('loads a set of generators with right glob patterns and different base', async () => {
    mockedRequireUtils.resolveModule.mockReturnValueOnce(
      '/modules/test-generators/package.json'
    );
    vol.fromJSON(
      {
        '/modules/test-generators/dist/generators/one/generatorOne/index.ts':
          'a();',
        '/modules/test-generators/dist/generators/two/generatorTwo/index.ts':
          'a();',
        '/modules/test-generators/dist/generators/index.ts': 'a();',
        '/modules/test-generators/dist/generators/one/index.yml': 'test',
        '/modules/test-generators/generator.json': JSON.stringify({
          generatorBaseDirectory: 'dist/generators',
          generatorPatterns: ['*/*'],
        }),
        '/modules/test-generators/dist/random/foo.yml': 'test',
      },
      '/modules/test-generators'
    );
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
      '@halfdomelabs/test-generators'
    );

    expect(generator).toEqual({
      '@halfdomelabs/test/one/generatorOne': {
        ...mockGeneratorOne,
        configBaseDirectory:
          '/modules/test-generators/dist/generators/one/generatorOne',
      },
      '@halfdomelabs/test/two/generatorTwo': {
        ...mockGeneratorTwo,
        configBaseDirectory:
          '/modules/test-generators/dist/generators/two/generatorTwo',
      },
    });

    expect(mockedRequireUtils.resolveModule).toHaveBeenCalledWith(
      '@halfdomelabs/test-generators/package.json'
    );
    expect(mockedRequireUtils.getModuleDefault).toHaveBeenCalledWith(
      '/modules/test-generators/dist/generators/one/generatorOne'
    );
    expect(mockedRequireUtils.getModuleDefault).toHaveBeenCalledWith(
      '/modules/test-generators/dist/generators/two/generatorTwo'
    );
  });
});
