import {
  getEntityAction,
  getEntitySchemaAction,
  listEntitiesAction,
  listEntityTypesAction,
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
import {
  testProjectGenerateAction,
  testProjectInitAction,
  testProjectSaveAction,
} from './test-project/index.js';

export const USER_SERVICE_ACTIONS = [
  diffProjectAction,
  syncProjectAction,
  syncAllProjectsAction,
  syncFileAction,
  listEntitiesAction,
  listEntityTypesAction,
  getEntityAction,
  getEntitySchemaAction,
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
  testProjectGenerateAction,
  testProjectInitAction,
  testProjectSaveAction,
];
