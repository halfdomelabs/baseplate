import { testAction } from '@baseplate-dev/sync';
import { describe, expect, it } from 'vitest';

import { tsCodeFragment } from '../fragments/creators.js';
import { tsImportBuilder } from '../imports/builder.js';
import { renderTsFragmentAction } from './render-ts-fragment-action.js';

describe('renderTsFragmentAction', () => {
  it('should write file from fragment with imports', async () => {
    const action = renderTsFragmentAction({
      fragment: tsCodeFragment('const greeting = "Hello World";', [
        tsImportBuilder().named('Greeting').from('./greeting'),
      ]),
      id: 'test-id',
      destination: 'output/test.ts',
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.ts');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual(
      'import { Greeting } from "./greeting";\n\nconst greeting = "Hello World";',
    );
  });

  it('should write file from fragment with hoisted fragments', async () => {
    const action = renderTsFragmentAction({
      fragment: tsCodeFragment('const greeting = "Hello World";', [], {
        hoistedFragments: [
          {
            key: 'types',
            contents: 'type Greeting = string;',
          },
        ],
      }),
      id: 'test-id',
      destination: 'output/test.ts',
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.ts');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual(
      'type Greeting = string;\n\nconst greeting = "Hello World";',
    );
  });

  it('should write file from simple string fragment', async () => {
    const action = renderTsFragmentAction({
      fragment: tsCodeFragment('const greeting = "Hello World";'),
      id: 'test-id',
      destination: 'output/test.ts',
    });

    const output = await testAction(action);

    expect(output.files.size).toBe(1);
    const file = output.files.get('output/test.ts');
    expect(file?.id).toBe('test-generator:test-id');
    expect(file?.contents).toEqual('const greeting = "Hello World";');
  });
});
