import { flattenAppModule } from '@src/utils/app-modules.js';

import { authPlugin } from './plugins/auth.plugin.js';

/* TPL_IMPORTS:BLOCK */

export const /* TPL_MODULE_NAME:START */ authModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        plugins: [authPlugin],
      } /* TPL_MODULE_CONTENTS:END */,
    );
