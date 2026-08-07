import { diffProjectMetadata } from '#src/actions/diff/diff-project.action-metadata.js';
import { snapshotAddMetadata } from '#src/actions/snapshot/snapshot-add.action-metadata.js';
import { snapshotRemoveMetadata } from '#src/actions/snapshot/snapshot-remove.action-metadata.js';
import { snapshotSaveMetadata } from '#src/actions/snapshot/snapshot-save.action-metadata.js';
import { snapshotShowMetadata } from '#src/actions/snapshot/snapshot-show.action-metadata.js';
import { syncProjectMetadata } from '#src/actions/sync/sync-project.action-metadata.js';
import { discoverGeneratorsMetadata } from '#src/actions/template-extractor/discover-generators.action-metadata.js';
import { extractTemplatesMetadata } from '#src/actions/template-extractor/extract-templates.action-metadata.js';
import { generateTemplatesMetadata } from '#src/actions/template-extractor/generate-templates.action-metadata.js';
import { configureRawTemplateMetadata } from '#src/actions/templates/configure-raw-template.action-metadata.js';
import { configureTextTemplateMetadata } from '#src/actions/templates/configure-text-template.action-metadata.js';
import { configureTsTemplateMetadata } from '#src/actions/templates/configure-ts-template.action-metadata.js';
import { deleteTemplateMetadata } from '#src/actions/templates/delete-template.action-metadata.js';
import { listTemplatesMetadata } from '#src/actions/templates/list-templates.action-metadata.js';

import { devRouter, devTrpcActionBuilder } from './trpc.js';

export const devServerRouter = devRouter({
  diff: devRouter({
    diffProject: devTrpcActionBuilder.mutation(diffProjectMetadata),
  }),
  templateExtractor: devRouter({
    extract: devTrpcActionBuilder.mutation(extractTemplatesMetadata),
    generate: devTrpcActionBuilder.mutation(generateTemplatesMetadata),
    discoverGenerators: devTrpcActionBuilder.query(discoverGeneratorsMetadata),
  }),
  templates: devRouter({
    list: devTrpcActionBuilder.query(listTemplatesMetadata),
    delete: devTrpcActionBuilder.mutation(deleteTemplateMetadata),
    configureTsTemplate: devTrpcActionBuilder.mutation(
      configureTsTemplateMetadata,
    ),
    configureTextTemplate: devTrpcActionBuilder.mutation(
      configureTextTemplateMetadata,
    ),
    configureRawTemplate: devTrpcActionBuilder.mutation(
      configureRawTemplateMetadata,
    ),
  }),
  snapshot: devRouter({
    add: devTrpcActionBuilder.mutation(snapshotAddMetadata),
    remove: devTrpcActionBuilder.mutation(snapshotRemoveMetadata),
    save: devTrpcActionBuilder.mutation(snapshotSaveMetadata),
    show: devTrpcActionBuilder.query(snapshotShowMetadata),
  }),
  project: devRouter({
    sync: devTrpcActionBuilder.mutation(syncProjectMetadata),
  }),
});

export type DevServerRouter = typeof devServerRouter;
