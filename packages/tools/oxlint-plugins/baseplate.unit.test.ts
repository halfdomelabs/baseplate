import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vitest';

import baseplatePlugin from './baseplate.js';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run(
  'no-unused-generator-dependencies',
  // oxlint exports no Rule type, and the inferred JS object widens literals
  baseplatePlugin.rules['no-unused-generator-dependencies'] as Parameters<
    RuleTester['run']
  >[1],
  {
    valid: [
      `createGeneratorTask({
        dependencies: { foo: fooProvider },
        run({ foo }) { return foo; },
      });`,
      `createGeneratorTask({ run() {} });`,
      `somethingElse({ dependencies: { foo: fooProvider }, run() {} });`,
    ],
    invalid: [
      {
        code: `createGeneratorTask({
  dependencies: { foo: fooProvider, bar: barProvider },
  run({ foo }) { return foo; },
});`,
        output: `createGeneratorTask({
  dependencies: { foo: fooProvider,  },
  run({ foo }) { return foo; },
});`,
        errors: [
          { messageId: 'unusedDependency', data: { dependencyName: 'bar' } },
        ],
      },
      {
        code: `tasks.createGeneratorTask({
  dependencies: { foo: fooProvider, bar: barProvider },
  run: () => {},
});`,
        output: `tasks.createGeneratorTask({
  dependencies: {   },
  run: () => {},
});`,
        errors: 2,
      },
    ],
  },
);
