import { flow } from 'es-toolkit';

import {
  renameObjectKeysTransform,
  transformJsonPath,
} from './transform-json-path.js';
import { createSchemaMigration } from './types.js';

export const migration009RenameRefs = createSchemaMigration<unknown, unknown>({
  version: 9,
  name: 'renameRefs',
  description: 'Rename zRefs to be suffixed with "Ref"',
  migrate: (config) => {
    // const definition: ProjectDefinition = config;
    // const adminConfig: AdminAppConfig;
    // adminConfig.sections?.[0].form.fields[0];
    const transform = flow(
      (c: unknown) =>
        transformJsonPath(
          c,
          'apps.*.sections.*',
          renameObjectKeysTransform({
            feature: 'featureRef',
            modelName: 'modelRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'apps.*.sections.*.form.fields.*',
          renameObjectKeysTransform({
            localRelationName: 'localRelationRef',
            modelField: 'modelFieldRef',
            localRelation: 'localRelationRef',
            modelRelation: 'modelRelationRef',
            embeddedFormName: 'embeddedFormRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'apps.*.sections.*.embeddedForms.*.form.fields.*',
          renameObjectKeysTransform({
            localRelationName: 'localRelationRef',
            localRelation: 'localRelationRef',
            modelField: 'modelFieldRef',
            modelRelation: 'modelRelationRef',
            embeddedFormName: 'embeddedFormRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'apps.*.sections.*.table.columns.*.display',
          renameObjectKeysTransform({
            modelField: 'modelFieldRef',
            localRelationName: 'localRelationRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'apps.*.sections.*.embeddedForms.*.table.columns.*.display',
          renameObjectKeysTransform({
            modelField: 'modelFieldRef',
            localRelationName: 'localRelationRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'apps.*.sections.*.embeddedForms.*',
          renameObjectKeysTransform({
            modelName: 'modelRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'auth',
          renameObjectKeysTransform({
            userModel: 'userModelRef',
            userRoleModel: 'userRoleModelRef',
            authFeaturePath: 'authFeatureRef',
            accountsFeaturePath: 'accountsFeatureRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'enums.*',
          renameObjectKeysTransform({
            feature: 'featureRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'models.*.model.fields.*.options',
          renameObjectKeysTransform({
            enumType: 'enumRef',
            defaultEnumValue: 'defaultEnumValueRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'models.*',
          renameObjectKeysTransform({
            feature: 'featureRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'models.*.model.relations.*.references.*',
          renameObjectKeysTransform({
            local: 'localRef',
            foreign: 'foreignRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'models.*.model.relations.*',
          renameObjectKeysTransform({
            modelName: 'modelRef',
          }),
        ),
      (c) =>
        transformJsonPath(
          c,
          'plugins.*.config.categories.*',
          renameObjectKeysTransform({
            usedByRelation: 'usedByRelationRef',
            defaultAdapter: 'defaultAdapterRef',
          }),
        ),
    );
    return transform(config) as unknown;
  },
});
