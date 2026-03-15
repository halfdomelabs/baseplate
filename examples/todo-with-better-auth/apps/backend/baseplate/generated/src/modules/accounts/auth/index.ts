import { flattenAppModule } from '@src/utils/app-modules.js';

import { authPlugin } from './plugins/auth.plugin.js';
import { betterAuthPlugin } from './plugins/better-auth.plugin.js';

/* TPL_IMPORTS:START */
import './schema/user-role.object-type.js';
import './schema/user-session.queries.js';
import './schema/user.mutations.js';
import './schema/user.object-type.js';
import './schema/user.queries.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ authModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        plugins: [authPlugin, betterAuthPlugin],
      } /* TPL_MODULE_CONTENTS:END */,
    );
