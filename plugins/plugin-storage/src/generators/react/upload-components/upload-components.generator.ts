import {
  CORE_PACKAGES,
  createNodePackagesTask,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { STORAGE_PACKAGES } from '#src/constants/index.js';

import { REACT_UPLOAD_COMPONENTS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const uploadComponentsGenerator = createGenerator({
  name: 'react/upload-components',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: {
        axios: CORE_PACKAGES.axios,
        'react-dropzone': STORAGE_PACKAGES['react-dropzone'],
        'react-circular-progressbar':
          STORAGE_PACKAGES['react-circular-progressbar'],
      },
    }),
    paths: REACT_UPLOAD_COMPONENTS_GENERATED.paths.task,
    imports: REACT_UPLOAD_COMPONENTS_GENERATED.imports.task,
    renderers: REACT_UPLOAD_COMPONENTS_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: REACT_UPLOAD_COMPONENTS_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.fileInputComponent.render({}),
              renderers.fileInputField.render({}),
              renderers.hooksUseUpload.render({}),
            );
          },
        };
      },
    }),
  }),
});
