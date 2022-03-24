import { TypescriptCodeUtils } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { reactComponentsProvider } from '../react-components';
import { reactRouterProvider } from '../react-router';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

const ReactNotFoundHandlerGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    reactRouter: reactRouterProvider,
    reactComponents: reactComponentsProvider,
  },
  createGenerator(descriptor, { reactRouter, reactComponents }) {
    reactRouter.setMatchAllElement(
      TypescriptCodeUtils.createExpression(
        `<Route element={<UnauthenticatedLayout />}>
        <Route path="*" element={<NotFoundCard />} />
      </Route>`,
        [
          `import {NotFoundCard, UnauthenticatedLayout} from '@components';`,
          `import { Route } from 'react-router-dom';`,
        ],
        { importMappers: [reactComponents] }
      )
    );
    return {
      build: () => {},
    };
  },
});

export default ReactNotFoundHandlerGenerator;
