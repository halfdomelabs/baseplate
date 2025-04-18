import {
  createNodePackagesTask,
  extractPackageVersions,
  tsCodeFragment,
  tsImportBuilder,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { fastifyServerConfigProvider } from '../fastify-server/fastify-server.generator.js';
import { requestServiceContextSetupProvider } from '../request-service-context/request-service-context.generator.js';

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
        fastifyServerConfig: fastifyServerConfigProvider,
        requestServiceContextSetup: requestServiceContextSetupProvider,
      },
      run({ fastifyServerConfig, requestServiceContextSetup }) {
        fastifyServerConfig.plugins.set('cookies', {
          plugin: tsCodeFragment(
            'fastifyCookie',
            tsImportBuilder().default('fastifyCookie').from('@fastify/cookie'),
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
