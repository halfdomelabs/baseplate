import type { ActionName } from './action-metadata-manifest.js';
import type { AnyServiceAction } from './types.js';

/**
 * Lazily loads a single action's module, including its handler.
 *
 * @remarks Consumed only by the action worker, which needs exactly one handler
 * per invocation. Importing every action instead would load ts-morph and the
 * generator packages into each worker thread.
 */
export const ACTION_LOADERS = {
  'diff-project': () =>
    import('./diff/diff-project.action.js').then((m) => m.diffProjectAction),
  'sync-project': () =>
    import('./sync/sync-project.action.js').then((m) => m.syncProjectAction),
  'sync-all-projects': () =>
    import('./sync/sync-all-projects.action.js').then(
      (m) => m.syncAllProjectsAction,
    ),
  'sync-file': () =>
    import('./sync/sync-file.action.js').then((m) => m.syncFileAction),
  'list-entities': () =>
    import('./definition/list-entities.action.js').then(
      (m) => m.listEntitiesAction,
    ),
  'list-entity-types': () =>
    import('./definition/list-entity-types.action.js').then(
      (m) => m.listEntityTypesAction,
    ),
  'search-entities': () =>
    import('./definition/search-entities.action.js').then(
      (m) => m.searchEntitiesAction,
    ),
  'get-entity': () =>
    import('./definition/get-entity.action.js').then((m) => m.getEntityAction),
  'get-entity-schema': () =>
    import('./definition/get-entity-schema.action.js').then(
      (m) => m.getEntitySchemaAction,
    ),
  'stage-create-entity': () =>
    import('./definition/stage-create-entity.action.js').then(
      (m) => m.stageCreateEntityAction,
    ),
  'stage-update-entity': () =>
    import('./definition/stage-update-entity.action.js').then(
      (m) => m.stageUpdateEntityAction,
    ),
  'stage-patch-entity': () =>
    import('./definition/stage-patch-entity.action.js').then(
      (m) => m.stagePatchEntityAction,
    ),
  'stage-delete-entity': () =>
    import('./definition/stage-delete-entity.action.js').then(
      (m) => m.stageDeleteEntityAction,
    ),
  'apply-fix': () =>
    import('./definition/apply-fix.action.js').then((m) => m.applyFixAction),
  'commit-draft': () =>
    import('./definition/commit-draft.action.js').then(
      (m) => m.commitDraftAction,
    ),
  'discard-draft': () =>
    import('./definition/discard-draft.action.js').then(
      (m) => m.discardDraftAction,
    ),
  'show-draft': () =>
    import('./definition/show-draft.action.js').then((m) => m.showDraftAction),
  'list-plugins': () =>
    import('./definition/list-plugins.action.js').then(
      (m) => m.listPluginsAction,
    ),
  'get-plugin-info': () =>
    import('./definition/get-plugin-info.action.js').then(
      (m) => m.getPluginInfoAction,
    ),
  'configure-plugin': () =>
    import('./definition/configure-plugin.action.js').then(
      (m) => m.configurePluginAction,
    ),
  'disable-plugin': () =>
    import('./definition/disable-plugin.action.js').then(
      (m) => m.disablePluginAction,
    ),
  'discover-generators': () =>
    import('./template-extractor/discover-generators.action.js').then(
      (m) => m.discoverGeneratorsAction,
    ),
  'extract-templates': () =>
    import('./template-extractor/extract-templates.action.js').then(
      (m) => m.extractTemplatesAction,
    ),
  'generate-templates': () =>
    import('./template-extractor/generate-templates.action.js').then(
      (m) => m.generateTemplatesAction,
    ),
  'create-generator': () =>
    import('./generators/create-generator.action.js').then(
      (m) => m.createGeneratorAction,
    ),
  'configure-ts-template': () =>
    import('./templates/configure-ts-template.action.js').then(
      (m) => m.configureTsTemplateAction,
    ),
  'configure-text-template': () =>
    import('./templates/configure-text-template.action.js').then(
      (m) => m.configureTextTemplateAction,
    ),
  'configure-raw-template': () =>
    import('./templates/configure-raw-template.action.js').then(
      (m) => m.configureRawTemplateAction,
    ),
  'delete-template': () =>
    import('./templates/delete-template.action.js').then(
      (m) => m.deleteTemplateAction,
    ),
  'list-templates': () =>
    import('./templates/list-templates.action.js').then(
      (m) => m.listTemplatesAction,
    ),
  'show-template-metadata': () =>
    import('./templates/show-template-metadata.action.js').then(
      (m) => m.showTemplateMetadataAction,
    ),
  'snapshot-add': () =>
    import('./snapshot/snapshot-add.action.js').then(
      (m) => m.snapshotAddAction,
    ),
  'snapshot-remove': () =>
    import('./snapshot/snapshot-remove.action.js').then(
      (m) => m.snapshotRemoveAction,
    ),
  'snapshot-save': () =>
    import('./snapshot/snapshot-save.action.js').then(
      (m) => m.snapshotSaveAction,
    ),
  'snapshot-show': () =>
    import('./snapshot/snapshot-show.action.js').then(
      (m) => m.snapshotShowAction,
    ),
  'init-project': () =>
    import('./test-project/test-project-init.action.js').then(
      (m) => m.initProjectAction,
    ),
} satisfies Record<ActionName, () => Promise<AnyServiceAction>>;
