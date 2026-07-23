import { defineAppModule } from '@src/utils/app-modules.js';

import { sendEmailWorker } from './queues/send-email.worker.js';

/* TPL_IMPORTS:BLOCK */

export const /* TPL_MODULE_NAME:START */ emailsModule /* TPL_MODULE_NAME:END */ =
    defineAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        queues: [sendEmailWorker],
      } /* TPL_MODULE_CONTENTS:END */,
    );
