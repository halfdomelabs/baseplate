import { diffProjectAction } from './diff/diff-project.action.js';
import { syncProjectAction } from './sync/index.js';
import {
  deleteTemplateAction,
  extractTemplatesAction,
  generateTemplatesAction,
  listTemplatesAction,
} from './template-extractor/index.js';

export const ALL_SERVICE_ACTIONS = [
  diffProjectAction,
  syncProjectAction,
  deleteTemplateAction,
  extractTemplatesAction,
  generateTemplatesAction,
  listTemplatesAction,
];
