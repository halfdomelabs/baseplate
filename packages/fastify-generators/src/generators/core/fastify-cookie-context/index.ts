import {
  nodeProvider,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';

import { fastifyServerProvider } from '@src/generators/core/fastify-server/index.js';

import { requestServiceContextSetupProvider } from '../request-service-context/index.js';

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
    { node, fastifyServer, requestServiceContextSetup },
  ) {
    node.addPackages({
      '@fastify/cookie': '11.0.1',
    });

    fastifyServer.registerPlugin({
      name: 'cookies',
      plugin: new TypescriptCodeExpression(
        'fastifyCookie',
        "import fastifyCookie from '@fastify/cookie'",
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
            "import { CookieSerializeOptions } from '@fastify/cookie';",
          ),
        ],
      }),
      body: (req, reply) =>
        new TypescriptCodeBlock(
          `function getReply(): FastifyReply {
          if (!${reply}) {
            throw new Error(
              'Reply is not defined. This may happen if calling this function from a websocket connection.'
            );
          }
          return ${reply};
        }
      `,
        ),
      creator: (req) =>
        new TypescriptCodeExpression(
          `
{
  get: (name) => ${req}.cookies[name],
  set: (name, value, options) => void getReply().setCookie(name, value, options),
  clear: (name) => void getReply().clearCookie(name),
}
`,
        ),
    });
    return {};
  },
});

export default FastifyCookieContextGenerator;
