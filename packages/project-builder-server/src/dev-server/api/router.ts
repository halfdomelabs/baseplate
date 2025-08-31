import { diffProjectAction } from '#src/actions/diff/diff-project.action.js';
import {
  deleteTemplateAction,
  extractTemplatesAction,
  generateTemplatesAction,
  listTemplatesAction,
} from '#src/actions/index.js';

import { devRouter, devTrpcActionBuilder } from './trpc.js';

export const devServerRouter = devRouter({
  diff: devRouter({
    diffProject: devTrpcActionBuilder.mutation(diffProjectAction),
  }),
  templateExtractor: devRouter({
    delete: devTrpcActionBuilder.mutation(deleteTemplateAction),
    extract: devTrpcActionBuilder.mutation(extractTemplatesAction),
    generate: devTrpcActionBuilder.mutation(generateTemplatesAction),
    list: devTrpcActionBuilder.query(listTemplatesAction),
  }),
});

export type DevServerRouter = typeof devServerRouter;
