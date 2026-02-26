import {
  adminCrudActionEntityType,
  adminCrudColumnEntityType,
  adminCrudEmbeddedFormEntityType,
  adminCrudInputEntityType,
  adminCrudSectionColumnEntityType,
  adminSectionEntityType,
  appEntityType,
  createPluginModule,
  libraryEntityType,
  modelAuthorizerRoleEntityType,
  modelEntityType,
  modelEnumEntityType,
  modelEnumValueEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
  modelTransformerEntityType,
  pluginEntityType,
} from '@baseplate-dev/project-builder-lib';
import { entityTypeUrlWebSpec } from '@baseplate-dev/project-builder-lib/web';

export const entityTypeUrlsCoreModule = createPluginModule({
  name: 'entity-type-urls',
  dependencies: { entityTypeUrlWeb: entityTypeUrlWebSpec },
  initialize: ({ entityTypeUrlWeb }) => {
    // Models
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
    entityTypeUrlWeb.register(
      modelAuthorizerRoleEntityType,
      ({ parentKey }) => ({
        page: 'model',
        key: parentKey,
        subpath: 'authorization',
      }),
    );

    // Enums
    entityTypeUrlWeb.register(modelEnumEntityType, ({ entityKey }) => ({
      page: 'enum',
      key: entityKey,
    }));
    entityTypeUrlWeb.register(modelEnumValueEntityType, ({ parentKey }) => ({
      page: 'enum',
      key: parentKey,
    }));

    // Plugins
    entityTypeUrlWeb.register(pluginEntityType, ({ entityKey }) => ({
      page: 'plugin',
      key: entityKey,
    }));

    // Packages
    entityTypeUrlWeb.register(appEntityType, ({ entityKey }) => ({
      page: 'app',
      key: entityKey,
    }));
    entityTypeUrlWeb.register(libraryEntityType, ({ entityKey }) => ({
      page: 'lib',
      key: entityKey,
    }));

    // Admin sections — parentKey is the appKey, entityKey is the sectionKey
    entityTypeUrlWeb.register(
      adminSectionEntityType,
      ({ entityKey, parentKey }) => ({
        page: 'admin-section',
        appKey: parentKey,
        sectionKey: entityKey,
      }),
    );

    // Admin section children — parentKey is the sectionKey, grandparentKey is the appKey
    const adminSectionChildBuilder = ({
      parentKey,
      grandparentKey,
    }: {
      parentKey: string;
      grandparentKey: string | undefined;
    }):
      | { page: 'admin-section'; appKey: string; sectionKey: string }
      | undefined =>
      grandparentKey
        ? {
            page: 'admin-section',
            appKey: grandparentKey,
            sectionKey: parentKey,
          }
        : undefined;

    entityTypeUrlWeb.register(
      adminCrudActionEntityType,
      adminSectionChildBuilder,
    );
    entityTypeUrlWeb.register(
      adminCrudColumnEntityType,
      adminSectionChildBuilder,
    );
    entityTypeUrlWeb.register(
      adminCrudEmbeddedFormEntityType,
      adminSectionChildBuilder,
    );
    entityTypeUrlWeb.register(
      adminCrudInputEntityType,
      adminSectionChildBuilder,
    );
    entityTypeUrlWeb.register(
      adminCrudSectionColumnEntityType,
      adminSectionChildBuilder,
    );
  },
});
