import { diffProjectAction } from './diff/diff-project.action.js';
import {
  deleteTemplateAction,
  extractTemplatesAction,
  generateTemplatesAction,
  listTemplatesAction,
} from './template-extractor/index.js';

export const ALL_SERVICE_ACTIONS = [
  diffProjectAction,
  deleteTemplateAction,
  extractTemplatesAction,
  generateTemplatesAction,
  listTemplatesAction,
];
