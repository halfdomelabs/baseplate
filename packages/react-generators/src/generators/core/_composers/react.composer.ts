import type {
  GeneratorBundle,
  InferDescriptorFromGenerator,
} from '@halfdomelabs/sync';

import { reactAppGenerator } from '../react-app/react-app.generator.js';
import { reactComponentsGenerator } from '../react-components/react-components.generator.js';
import { reactConfigGenerator } from '../react-config/react-config.generator.js';
import { reactErrorBoundaryGenerator } from '../react-error-boundary/react-error-boundary.generator.js';
import { reactErrorGenerator } from '../react-error/react-error.generator.js';
import { reactLoggerGenerator } from '../react-logger/react-logger.generator.js';
import { reactProxyGenerator } from '../react-proxy/react-proxy.generator.js';
import { reactTypescriptGenerator } from '../react-typescript/react-typescript.generator.js';
import { reactUtilsGenerator } from '../react-utils/react-utils.generator.js';
import { reactGenerator } from '../react/react.generator.js';

export function composeReactGenerators(
  descriptor: InferDescriptorFromGenerator<typeof reactGenerator>,
  { devBackendHost }: { devBackendHost: string },
): GeneratorBundle {
  return reactGenerator({
    ...descriptor,
    children: {
      typescript: reactTypescriptGenerator({}),
      reactApp: reactAppGenerator({}),
      logger: reactLoggerGenerator({}),
      reactComponents: reactComponentsGenerator({}),
      reactConfig: reactConfigGenerator({}),
      reactProxy: reactProxyGenerator({ devBackendHost }),
      reactError: reactErrorGenerator({}),
      reactUtils: reactUtilsGenerator({}),
      reactErrorBoundary: reactErrorBoundaryGenerator({}),
      ...descriptor.children,
    },
  });
}
