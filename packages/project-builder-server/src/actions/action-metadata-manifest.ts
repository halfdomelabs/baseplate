import type { AnyServiceActionMetadata } from './types.js';

import { applyFixMetadata } from './definition/apply-fix.action-metadata.js';
import { commitDraftMetadata } from './definition/commit-draft.action-metadata.js';
import { configurePluginMetadata } from './definition/configure-plugin.action-metadata.js';
import { disablePluginMetadata } from './definition/disable-plugin.action-metadata.js';
import { discardDraftMetadata } from './definition/discard-draft.action-metadata.js';
import { getEntitySchemaMetadata } from './definition/get-entity-schema.action-metadata.js';
import { getEntityMetadata } from './definition/get-entity.action-metadata.js';
import { getPluginInfoMetadata } from './definition/get-plugin-info.action-metadata.js';
import { listEntitiesMetadata } from './definition/list-entities.action-metadata.js';
import { listEntityTypesMetadata } from './definition/list-entity-types.action-metadata.js';
import { listPluginsMetadata } from './definition/list-plugins.action-metadata.js';
import { searchEntitiesMetadata } from './definition/search-entities.action-metadata.js';
import { showDraftMetadata } from './definition/show-draft.action-metadata.js';
import { stageCreateEntityMetadata } from './definition/stage-create-entity.action-metadata.js';
import { stageDeleteEntityMetadata } from './definition/stage-delete-entity.action-metadata.js';
import { stagePatchEntityMetadata } from './definition/stage-patch-entity.action-metadata.js';
import { stageUpdateEntityMetadata } from './definition/stage-update-entity.action-metadata.js';
import { diffProjectMetadata } from './diff/diff-project.action-metadata.js';
import { createGeneratorMetadata } from './generators/create-generator.action-metadata.js';
import { snapshotAddMetadata } from './snapshot/snapshot-add.action-metadata.js';
import { snapshotRemoveMetadata } from './snapshot/snapshot-remove.action-metadata.js';
import { snapshotSaveMetadata } from './snapshot/snapshot-save.action-metadata.js';
import { snapshotShowMetadata } from './snapshot/snapshot-show.action-metadata.js';
import { syncAllProjectsMetadata } from './sync/sync-all-projects.action-metadata.js';
import { syncFileMetadata } from './sync/sync-file.action-metadata.js';
import { syncProjectMetadata } from './sync/sync-project.action-metadata.js';
import { discoverGeneratorsMetadata } from './template-extractor/discover-generators.action-metadata.js';
import { extractTemplatesMetadata } from './template-extractor/extract-templates.action-metadata.js';
import { generateTemplatesMetadata } from './template-extractor/generate-templates.action-metadata.js';
import { configureRawTemplateMetadata } from './templates/configure-raw-template.action-metadata.js';
import { configureTextTemplateMetadata } from './templates/configure-text-template.action-metadata.js';
import { configureTsTemplateMetadata } from './templates/configure-ts-template.action-metadata.js';
import { deleteTemplateMetadata } from './templates/delete-template.action-metadata.js';
import { listTemplatesMetadata } from './templates/list-templates.action-metadata.js';
import { showTemplateMetadataMetadata } from './templates/show-template-metadata.action-metadata.js';
import { initProjectMetadata } from './test-project/test-project-init.action-metadata.js';

/**
 * Every service action's metadata, in the order actions are presented to clients.
 *
 * @remarks Importing this module must not pull in any action handler — the
 * handlers depend on ts-morph and the generator packages, which cost hundreds of
 * megabytes to load. Use `ACTION_LOADERS` to load a handler on demand.
 */
export const ALL_SERVICE_ACTION_METADATA = [
  diffProjectMetadata,
  syncProjectMetadata,
  syncAllProjectsMetadata,
  syncFileMetadata,
  listEntitiesMetadata,
  listEntityTypesMetadata,
  searchEntitiesMetadata,
  getEntityMetadata,
  getEntitySchemaMetadata,
  stageCreateEntityMetadata,
  stageUpdateEntityMetadata,
  stagePatchEntityMetadata,
  stageDeleteEntityMetadata,
  applyFixMetadata,
  commitDraftMetadata,
  discardDraftMetadata,
  showDraftMetadata,
  listPluginsMetadata,
  getPluginInfoMetadata,
  configurePluginMetadata,
  disablePluginMetadata,
  discoverGeneratorsMetadata,
  extractTemplatesMetadata,
  generateTemplatesMetadata,
  createGeneratorMetadata,
  configureTsTemplateMetadata,
  configureTextTemplateMetadata,
  configureRawTemplateMetadata,
  deleteTemplateMetadata,
  listTemplatesMetadata,
  showTemplateMetadataMetadata,
  snapshotAddMetadata,
  snapshotRemoveMetadata,
  snapshotSaveMetadata,
  snapshotShowMetadata,
  initProjectMetadata,
] satisfies AnyServiceActionMetadata[];

/** Metadata for the actions exposed to end users via the `baseplate` CLI and MCP server. */
export const USER_SERVICE_ACTION_METADATA: AnyServiceActionMetadata[] =
  ALL_SERVICE_ACTION_METADATA.filter((action) => action.scope === 'user');

/**
 * The name of a registered service action.
 *
 * @remarks Derived from the manifest so that `ACTION_LOADERS` is checked against
 * it — adding an action without a loader (or vice versa) is a compile error.
 */
export type ActionName = (typeof ALL_SERVICE_ACTION_METADATA)[number]['name'];
