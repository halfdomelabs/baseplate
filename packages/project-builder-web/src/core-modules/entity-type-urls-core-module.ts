import {
  createPluginModule,
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelTransformerEntityType,
} from '@baseplate-dev/project-builder-lib';
import { entityTypeUrlWebSpec } from '@baseplate-dev/project-builder-lib/web';

export const entityTypeUrlsCoreModule = createPluginModule({
  name: 'entity-type-urls',
  dependencies: { entityTypeUrlWeb: entityTypeUrlWebSpec },
  initialize: ({ entityTypeUrlWeb }) => {
    entityTypeUrlWeb.register(modelEntityType, ({ entityKey }) => ({
      page: 'model',
      key: entityKey,
    }));
    entityTypeUrlWeb.register(modelScalarFieldEntityType, ({ parentKey }) => ({
      page: 'model',
      key: parentKey,
    }));
    entityTypeUrlWeb.register(
      modelLocalRelationEntityType,
      ({ parentKey }) => ({ page: 'model', key: parentKey }),
    );
    entityTypeUrlWeb.register(modelTransformerEntityType, ({ parentKey }) => ({
      page: 'model',
      key: parentKey,
      subpath: 'service',
    }));
  },
});
