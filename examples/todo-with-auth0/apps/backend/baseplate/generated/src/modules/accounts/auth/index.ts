import { flattenAppModule } from '@src/utils/app-modules.js';

import { authPlugin } from './plugins/auth.plugin.js';

/* TPL_IMPORTS:START */
import './schema/user-session.queries.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ authModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        plugins: [authPlugin],
      } /* TPL_MODULE_CONTENTS:END */,
    );
