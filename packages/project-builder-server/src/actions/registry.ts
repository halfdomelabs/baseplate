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

export const ALL_SERVICE_ACTIONS = [
  diffProjectAction,
  syncProjectAction,
  syncAllProjectsAction,
  syncFileAction,
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
];
