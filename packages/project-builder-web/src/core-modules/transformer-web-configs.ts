import {
  createPluginModule,
  modelTransformerEntityType,
} from '@baseplate-dev/project-builder-lib';
import {
  createModelTransformerWebConfig,
  modelTransformerWebSpec,
} from '@baseplate-dev/project-builder-lib/web';

import { embeddedRelationTransformerWebConfig } from '#src/routes/data/models/edit.$key/-components/service/service-embedded-relation-form.js';

const BUILT_IN_TRANSFORMER_WEB_CONFIGS = [
  embeddedRelationTransformerWebConfig,
  createModelTransformerWebConfig({
    name: 'password',
    label: 'Password',
    description: 'Hashes the input value using Argon2id',
    getNewTransformer: () => ({
      id: modelTransformerEntityType.generateNewId(),
      type: 'password',
    }),
    allowNewTransformer(_, modelConfig) {
      return (
        !modelConfig.service?.transformers?.some(
          (t) => t.type === 'password',
        ) && modelConfig.model.fields.some((f) => f.name === 'passwordHash')
      );
    },
    getSummary: () => [],
    pluginKey: undefined,
  }),
];

export const transformerWebConfigsCoreModule = createPluginModule({
  name: 'transformer-web-configs',
  dependencies: {
    transformerWeb: modelTransformerWebSpec,
  },
  initialize: ({ transformerWeb }) => {
    transformerWeb.transformers.addMany(BUILT_IN_TRANSFORMER_WEB_CONFIGS);
  },
});
