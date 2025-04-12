import { testAction } from '@halfdomelabs/sync';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tsCodeFragment } from '../fragments/creators.js';
import { tsImportBuilder } from '../imports/builder.js';
import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '../templates/types.js';
import { renderTsTemplateGroupAction } from './render-ts-template-group-action.js';

vi.mock('fs');
vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
});

describe('renderTsTemplateGroupAction', () => {
  it('should render multiple templates in a group with variables', async () => {
    vol.fromJSON({
      '/root/pkg/test-generator/templates/greeting.ts':
        'const greeting = TPL_GREETING;',
      '/root/pkg/test-generator/templates/welcome.ts':
        'const welcome = TPL_WELCOME;',
    });

    const group = createTsTemplateGroup({
      templates: {
        greeting: {
          destination: 'output/greeting.ts',
          template: createTsTemplateFile({
            name: 'greeting',
            source: {
              path: 'greeting.ts',
            },
            variables: {
              TPL_GREETING: { description: 'The greeting to use' },
            },
          }),
        },
        welcome: {
          destination: 'output/welcome.ts',
          template: createTsTemplateFile({
            name: 'welcome',
            source: {
              path: 'welcome.ts',
            },
            variables: {
              TPL_WELCOME: { description: 'The welcome message' },
            },
          }),
        },
      },
    });

    const action = renderTsTemplateGroupAction({
      group,
      baseDirectory: 'src',
      variables: {
        greeting: {
          TPL_GREETING: tsCodeFragment('"Hello World"'),
        },
        welcome: {
          TPL_WELCOME: tsCodeFragment('"Welcome to Baseplate"'),
        },
      },
      renderOptions: {
        greeting: {
          importMapProviders: {},
        },
        welcome: {
          importMapProviders: {},
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

    const greetingFile = output.files.get('src/output/greeting.ts');
    expect(greetingFile?.contents).toEqual('const greeting = "Hello World";');

    const welcomeFile = output.files.get('src/output/welcome.ts');
    expect(welcomeFile?.contents).toEqual(
      'const welcome = "Welcome to Baseplate";',
    );
  });

  it('should handle templates with imports', async () => {
    const group = createTsTemplateGroup({
      templates: {
        greeting: {
          destination: 'output/greeting.ts',
          template: createTsTemplateFile({
            name: 'greeting',
            source: {
              contents: 'const greeting = TPL_GREETING;',
            },
            variables: {
              TPL_GREETING: { description: 'The greeting to use' },
            },
          }),
        },
      },
    });

    const action = renderTsTemplateGroupAction({
      group,
      baseDirectory: 'src',
      variables: {
        greeting: {
          TPL_GREETING: tsCodeFragment('new Greeting("Hello")', [
            tsImportBuilder().named('Greeting').from('./greeting'),
          ]),
        },
      },
      renderOptions: {
        greeting: {
          importMapProviders: {},
        },
      },
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('src/output/greeting.ts');
    expect(file?.contents).toEqual(
      'import { Greeting } from "./greeting";\n\nconst greeting = new Greeting("Hello");',
    );
  });
});
