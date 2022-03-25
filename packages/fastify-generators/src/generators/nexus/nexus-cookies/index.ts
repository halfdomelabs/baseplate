import {
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { fastifyServerProvider } from '@src/generators/core/fastify-server';
import { nexusSetupProvider } from '../nexus';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

const NexusCookiesGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    fastifyServer: fastifyServerProvider,
    nexusSetup: nexusSetupProvider,
  },
  createGenerator(descriptor, { node, fastifyServer, nexusSetup }) {
    node.addPackages({
      'fastify-cookie': '^5.6.0',
    });

    fastifyServer.registerPlugin({
      name: 'cookies',
      plugin: new TypescriptCodeExpression(
        'fastifyCookie',
        "import fastifyCookie from 'fastify-cookie'"
      ),
    });

    nexusSetup.addContextField('cookieStore', {
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
            "import { CookieSerializeOptions } from 'fastify-cookie';"
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

export default NexusCookiesGenerator;
