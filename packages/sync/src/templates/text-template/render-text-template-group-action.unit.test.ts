import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { testAction } from '@src/output/builder-action-test-helpers.js';

import { renderTextTemplateGroupAction } from './render-text-template-group-action.js';
import { createTextTemplateFile, createTextTemplateGroup } from './types.js';

vi.mock('fs');
vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('renderTextTemplateGroupAction', () => {
  it('should render multiple templates in a group with variables', async () => {
    vol.fromJSON({
      '/root/pkg/test-generator/templates/greeting.txt': 'Hello {{TPL_NAME}}!',
      '/root/pkg/test-generator/templates/welcome.txt':
        'Welcome to {{TPL_PLACE}}!',
    });

    const group = createTextTemplateGroup({
      templates: {
        greeting: {
          destination: 'output/greeting.txt',
          template: createTextTemplateFile({
            name: 'greeting',
            source: {
              path: 'greeting.txt',
            },
            variables: {
              TPL_NAME: { description: 'The name to greet' },
            },
          }),
        },
        welcome: {
          destination: '@/output/welcome.txt',
          template: createTextTemplateFile({
            name: 'welcome',
            source: {
              path: 'welcome.txt',
            },
            variables: {
              TPL_PLACE: { description: 'The place to welcome to' },
            },
          }),
        },
      },
    });

    const action = renderTextTemplateGroupAction({
      group,
      baseDirectory: 'src',
      variables: {
        greeting: {
          TPL_NAME: 'John',
        },
        welcome: {
          TPL_PLACE: 'Baseplate',
        },
      },
    });

    const output = await testAction(action, {
      generatorInfo: {
        name: 'test-generator',
        baseDirectory: '/root/pkg/test-generator',
      },
    });

    expect(output.files.size).toBe(2);

    const greetingFile = output.files.get('src/output/greeting.txt');
    expect(greetingFile?.contents).toEqual('Hello John!');

    const welcomeFile = output.files.get('src/output/welcome.txt');
    expect(welcomeFile?.contents).toEqual('Welcome to Baseplate!');
  });
});
