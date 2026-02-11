import { flattenAppModule } from '@src/utils/app-modules.js';

/* TPL_IMPORTS:START */
import './schema/password-reset.mutations.js';
import './schema/user-password.mutations.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ passwordModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {} /* TPL_MODULE_CONTENTS:END */,
    );
