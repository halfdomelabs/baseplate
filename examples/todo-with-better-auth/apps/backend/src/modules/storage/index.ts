import { defineAppModule } from '@src/utils/app-modules.js';

import { cleanUnusedFilesWorker } from './queues/clean-unused-files.worker.js';

/* TPL_IMPORTS:START */
import './schema/file-category.enum.js';
import './schema/file-input.input-type.js';
import './schema/file.object-type.js';
import './schema/file.queries.js';
import './schema/presigned.mutations.js';
/* TPL_IMPORTS:END */
import './schema/public-url.field.js';

export const /* TPL_MODULE_NAME:START */ storageModule /* TPL_MODULE_NAME:END */ =
    defineAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        queues: [cleanUnusedFilesWorker],
      } /* TPL_MODULE_CONTENTS:END */,
    );
