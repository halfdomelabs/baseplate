import { flattenAppModule } from '@src/utils/app-modules.js';

import { authModule } from './auth/index.js';
import { usersModule } from './users/index.js';

/* TPL_IMPORTS:BLOCK */

export const /* TPL_MODULE_NAME:START */ accountsModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        children: [authModule, usersModule],
      } /* TPL_MODULE_CONTENTS:END */,
    );
