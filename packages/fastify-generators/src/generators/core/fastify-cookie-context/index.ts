import {
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import { fastifyServerProvider } from '@src/generators/core/fastify-server';
import { requestServiceContextSetupProvider } from '../request-service-context';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

const FastifyCookieContextGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    fastifyServer: fastifyServerProvider,
    requestServiceContextSetup: requestServiceContextSetupProvider,
  },
  createGenerator(
    descriptor,
    { node, fastifyServer, requestServiceContextSetup }
  ) {
    node.addPackages({
      '@fastify/cookie': '7.0.0',
    });

    fastifyServer.registerPlugin({
      name: 'cookies',
      plugin: new TypescriptCodeExpression(
        'fastifyCookie',
        "import fastifyCookie from '@fastify/cookie'"
      ),
    });

    requestServiceContextSetup.addContextField({
      name: 'cookieStore',
      type: TypescriptCodeUtils.createExpression('CookieStore', undefined, {
        headerBlocks: [
          TypescriptCodeUtils.createBlock(
            `
interface CookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieSerializeOptions): void;
  clear(name: string): void;
}
`,
            "import { CookieSerializeOptions } from '@fastify/cookie';"
          ),
        ],
      }),
      creator: (req, reply) =>
        new TypescriptCodeExpression(
          `
{
  get: (name) => ${req}.cookies[name],
  set: (name, value, options) => ${reply}.setCookie(name, value, options),
  clear: (name) => ${reply}.clearCookie(name),
}
`
        ),
    });
    return {
      build: async () => {},
    };
  },
});

export default FastifyCookieContextGenerator;
