import {
  applyFixAction,
  commitDraftAction,
  configurePluginAction,
  disablePluginAction,
  discardDraftAction,
  getEntityAction,
  getEntitySchemaAction,
  listEntitiesAction,
  listEntityTypesAction,
  listPluginsAction,
  searchEntitiesAction,
  showDraftAction,
  stageCreateEntityAction,
  stageDeleteEntityAction,
  stageUpdateEntityAction,
} from './definition/index.js';
import { diffProjectAction } from './diff/diff-project.action.js';
import { createGeneratorAction } from './generators/index.js';
import {
  snapshotAddAction,
  snapshotRemoveAction,
  snapshotSaveAction,
  snapshotShowAction,
} from './snapshot/index.js';
import {
  syncAllProjectsAction,
  syncFileAction,
  syncProjectAction,
} from './sync/index.js';
import {
  discoverGeneratorsAction,
  extractTemplatesAction,
  generateTemplatesAction,
} from './template-extractor/index.js';
import {
  configureRawTemplateAction,
  configureTextTemplateAction,
  configureTsTemplateAction,
  deleteTemplateAction,
  listTemplatesAction,
  showTemplateMetadataAction,
} from './templates/index.js';
import { initProjectAction } from './test-project/index.js';

export const USER_SERVICE_ACTIONS = [
  diffProjectAction,
  syncProjectAction,
  syncAllProjectsAction,
  syncFileAction,
  listEntitiesAction,
  listEntityTypesAction,
  searchEntitiesAction,
  getEntityAction,
  getEntitySchemaAction,
  stageCreateEntityAction,
  stageUpdateEntityAction,
  stageDeleteEntityAction,
  applyFixAction,
  commitDraftAction,
  discardDraftAction,
  showDraftAction,
  listPluginsAction,
  configurePluginAction,
  disablePluginAction,
];

export const ALL_SERVICE_ACTIONS = [
  ...USER_SERVICE_ACTIONS,
  discoverGeneratorsAction,
  extractTemplatesAction,
  generateTemplatesAction,
  createGeneratorAction,
  configureTsTemplateAction,
  configureTextTemplateAction,
  configureRawTemplateAction,
  deleteTemplateAction,
  listTemplatesAction,
  showTemplateMetadataAction,
  snapshotAddAction,
  snapshotRemoveAction,
  snapshotSaveAction,
  snapshotShowAction,
  initProjectAction,
];
