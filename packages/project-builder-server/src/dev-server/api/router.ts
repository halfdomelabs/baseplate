import { diffProjectAction } from '#src/actions/diff/diff-project.action.js';
import { snapshotAddAction } from '#src/actions/snapshot/snapshot-add.action.js';
import { snapshotRemoveAction } from '#src/actions/snapshot/snapshot-remove.action.js';
import { snapshotSaveAction } from '#src/actions/snapshot/snapshot-save.action.js';
import { snapshotShowAction } from '#src/actions/snapshot/snapshot-show.action.js';
import { syncProjectAction } from '#src/actions/sync/sync-project.action.js';
import {
  discoverGeneratorsAction,
  extractTemplatesAction,
  generateTemplatesAction,
} from '#src/actions/template-extractor/index.js';
import { configureRawTemplateAction } from '#src/actions/templates/configure-raw-template.action.js';
import { configureTextTemplateAction } from '#src/actions/templates/configure-text-template.action.js';
import { configureTsTemplateAction } from '#src/actions/templates/configure-ts-template.action.js';
import { deleteTemplateAction } from '#src/actions/templates/delete-template.action.js';
import { listTemplatesAction } from '#src/actions/templates/list-templates.action.js';

import { devRouter, devTrpcActionBuilder } from './trpc.js';

export const devServerRouter = devRouter({
  diff: devRouter({
    diffProject: devTrpcActionBuilder.mutation(diffProjectAction),
  }),
  templateExtractor: devRouter({
    extract: devTrpcActionBuilder.mutation(extractTemplatesAction),
    generate: devTrpcActionBuilder.mutation(generateTemplatesAction),
    discoverGenerators: devTrpcActionBuilder.query(discoverGeneratorsAction),
  }),
  templates: devRouter({
    list: devTrpcActionBuilder.query(listTemplatesAction),
    delete: devTrpcActionBuilder.mutation(deleteTemplateAction),
    configureTsTemplate: devTrpcActionBuilder.mutation(
      configureTsTemplateAction,
    ),
    configureTextTemplate: devTrpcActionBuilder.mutation(
      configureTextTemplateAction,
    ),
    configureRawTemplate: devTrpcActionBuilder.mutation(
      configureRawTemplateAction,
    ),
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
