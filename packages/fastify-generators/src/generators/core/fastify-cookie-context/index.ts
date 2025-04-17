import {
  createNodePackagesTask,
  extractPackageVersions,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';
import { fastifyServerProvider } from '@src/generators/core/fastify-server/index.js';

import { requestServiceContextSetupProvider } from '../request-service-context/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export const fastifyCookieContextGenerator = createGenerator({
  name: 'core/fastify-cookie-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['@fastify/cookie']),
    }),
    main: createGeneratorTask({
      dependencies: {
        fastifyServer: fastifyServerProvider,
        requestServiceContextSetup: requestServiceContextSetupProvider,
      },
      run({ fastifyServer, requestServiceContextSetup }) {
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
    }),
  }),
});
