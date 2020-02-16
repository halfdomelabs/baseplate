import mock from 'mock-fs';
import { SyncService } from './SyncService';

describe('load descriptor', () => {
  test('should load a plain descriptor', () => {
    mock({
      '/workspace/baseplate/project.json': JSON.stringify({
        module: '@baseplate/sync:workspace',
        name: 'myProject',
      }),
    });

    const descriptor = SyncService.loadDescriptor('/workspace');

    expect(descriptor.module).toEqual('@baseplate/sync:workspace');
    expect(descriptor.name).toEqual('myProject');
  });

  afterEach(() => {
    mock.restore();
  });
});
