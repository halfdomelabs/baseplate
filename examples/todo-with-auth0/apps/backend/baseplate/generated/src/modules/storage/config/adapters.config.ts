import { config } from '@src/services/config.js';

import { createS3Adapter } from '../adapters/s3.js';
import { createUrlAdapter } from '../adapters/url.js';

export const STORAGE_ADAPTERS = /* TPL_ADAPTERS:START */ {
  uploads: createS3Adapter({
    bucket: config.AWS_UPLOADS_BUCKET,
    publicUrl: config.AWS_UPLOADS_URL,
    region: config.AWS_DEFAULT_REGION,
  }),
  url: createUrlAdapter(),
}; /* TPL_ADAPTERS:END */

export type StorageAdapterKey = keyof typeof STORAGE_ADAPTERS;
