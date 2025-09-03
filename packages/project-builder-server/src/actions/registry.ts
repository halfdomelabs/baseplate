import { diffProjectAction } from './diff/diff-project.action.js';
import {
  snapshotAddAction,
  snapshotRemoveAction,
  snapshotSaveAction,
  snapshotShowAction,
} from './snapshot/index.js';
import { syncProjectAction } from './sync/index.js';
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

export const ALL_SERVICE_ACTIONS = [
  diffProjectAction,
  syncProjectAction,
  discoverGeneratorsAction,
  extractTemplatesAction,
  generateTemplatesAction,
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
];
