import { Volume } from 'memfs';
import * as yup from 'yup';
import createPromisesApi from 'memfs/lib/promises';
import { Module, Descriptor, Action } from './types';
import { SyncService } from './SyncService';

function generateMockAction(action?: Partial<Action>): Action {
  return {
    name: 'test-action',
    displayName: 'Test Action',
    description: 'Test Description',
    // eslint-disable-next-line @typescript-eslint/require-await
    execute: async () => {},
    ...action,
  };
}

describe('load descriptor', () => {
  interface CustomDescriptor extends Descriptor {
    customString: string;
    customObject: {
      customNull?: string;
    };
  }

  test('should load a descriptor with custom fields', async () => {
    const vol = Volume.fromJSON({
      '/workspace/baseplate/project.json': JSON.stringify({
        module: 'core:test',
        name: 'myProject',
        customString: 'customValue',
        customObject: {
          customNull: null,
        },
      }),
    });

    const service = new SyncService(
      {
        'core:test': {
          name: 'test',
          descriptorSchema: {
            customString: yup.string().required(),
            customObject: yup.object({
              customNull: yup.string().nullable(),
            }),
          },
        } as Module<CustomDescriptor>,
      },
      { volume: createPromisesApi(vol) }
    );
    const descriptor = (await service.loadProject(
      '/workspace'
    )) as CustomDescriptor;

    expect(descriptor.module).toEqual('core:test');
    expect(descriptor.name).toEqual('myProject');
    expect(descriptor.customString).toEqual('customValue');
    expect(descriptor.customObject).toEqual({ customNull: null });
  });
});

describe('build', () => {
  it('should pass descriptor to module build', () => {
    const mockBuild = jest.fn().mockReturnValue([]);
    const service = new SyncService({
      'core:test': {
        name: 'test',
        build: mockBuild,
      } as Module<Descriptor>,
    });
    const descriptor = {
      module: 'core:test',
      name: 'myTestBuild',
    };

    service.build(descriptor);

    expect(mockBuild).toHaveBeenCalledWith(descriptor, '/');
  });

  it('should return actions built up', () => {
    const mockAction = generateMockAction();
    const mockBuild = jest.fn().mockReturnValue([mockAction]);
    const service = new SyncService({
      'core:test': {
        name: 'test',
        build: mockBuild,
      } as Module<Descriptor>,
    });
    const descriptor = {
      module: 'core:test',
      name: 'myTestBuild',
    };

    const actions = service.build(descriptor);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toBe(mockAction);
  });
});
