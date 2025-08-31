import { diffProjectAction } from '#src/actions/diff/diff-project.action.js';
import {
  deleteTemplateAction,
  extractTemplatesAction,
  generateTemplatesAction,
  listTemplatesAction,
} from '#src/actions/index.js';
import { snapshotAddAction } from '#src/actions/snapshot/snapshot-add.action.js';
import { snapshotRemoveAction } from '#src/actions/snapshot/snapshot-remove.action.js';
import { snapshotSaveAction } from '#src/actions/snapshot/snapshot-save.action.js';
import { snapshotShowAction } from '#src/actions/snapshot/snapshot-show.action.js';
import { syncProjectAction } from '#src/actions/sync/sync-project.action.js';

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
  snapshot: devRouter({
    add: devTrpcActionBuilder.mutation(snapshotAddAction),
    remove: devTrpcActionBuilder.mutation(snapshotRemoveAction),
    save: devTrpcActionBuilder.mutation(snapshotSaveAction),
    show: devTrpcActionBuilder.query(snapshotShowAction),
  }),
  project: devRouter({
    sync: devTrpcActionBuilder.mutation(syncProjectAction),
  }),
});

export type DevServerRouter = typeof devServerRouter;
