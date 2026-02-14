import type {
  GeneratorBundle,
  InferDescriptorFromGenerator,
} from '@baseplate-dev/sync';

import { reactAppGenerator } from '../react-app/index.js';
import { reactComponentsGenerator } from '../react-components/index.js';
import { reactConfigGenerator } from '../react-config/index.js';
import { reactErrorBoundaryGenerator } from '../react-error-boundary/index.js';
import { reactErrorGenerator } from '../react-error/index.js';
import { reactLoggerGenerator } from '../react-logger/index.js';
import { reactProxyGenerator } from '../react-proxy/index.js';
import { reactTypescriptGenerator } from '../react-typescript/index.js';
import { reactUtilsGenerator } from '../react-utils/index.js';
import { reactGenerator } from '../react/index.js';

export function composeReactGenerators(
  descriptor: InferDescriptorFromGenerator<typeof reactGenerator>,
  {
    devBackendHost,
    devWebPort,
  }: {
    devBackendHost: string;
    devWebPort: number;
  },
): GeneratorBundle {
  return reactGenerator({
    ...descriptor,
    children: {
      typescript: reactTypescriptGenerator({}),
      reactApp: reactAppGenerator({}),
      logger: reactLoggerGenerator({}),
      reactComponents: reactComponentsGenerator({}),
      reactConfig: reactConfigGenerator({ devWebPort }),
      reactProxy: reactProxyGenerator({ devBackendHost }),
      reactError: reactErrorGenerator({}),
      reactUtils: reactUtilsGenerator({}),
      reactErrorBoundary: reactErrorBoundaryGenerator({}),
      ...descriptor.children,
    },
  });
}
