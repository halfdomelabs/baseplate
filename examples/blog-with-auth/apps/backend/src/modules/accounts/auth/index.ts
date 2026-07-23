import { defineAppModule } from '@src/utils/app-modules.js';

import { passwordModule } from './password/index.js';
import { authPlugin } from './plugins/auth.plugin.js';
import { cleanupAuthVerificationWorker } from './queues/cleanup-auth-verification.worker.js';

/* TPL_IMPORTS:START */
import './schema/auth-role.enum.js';
import './schema/user-roles.mutations.js';
import './schema/user-session-payload.object-type.js';
import './schema/user-session.mutations.js';
import './schema/user-session.queries.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ authModule /* TPL_MODULE_NAME:END */ =
    defineAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        children: [passwordModule],
        plugins: [authPlugin],
        queues: [cleanupAuthVerificationWorker],
      } /* TPL_MODULE_CONTENTS:END */,
    );
