import { modelTransformerEntityType } from '@halfdomelabs/project-builder-lib';
import { createNewModelTransformerWebConfig } from '@halfdomelabs/project-builder-lib/web';

import { embeddedRelationTransformerWebConfig } from '../edit/service/ServiceEmbeddedRelationForm';

export const BUILT_IN_TRANSFORMER_WEB_CONFIGS = [
  embeddedRelationTransformerWebConfig,
  createNewModelTransformerWebConfig({
    name: 'password',
    label: 'Password',
    description: "Hashes the input value of value 'password' using SHA-256",
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
    pluginId: undefined,
  }),
];
