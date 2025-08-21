import { flattenAppModule } from '@src/utils/app-modules.js';

/* TPL_IMPORTS:START */
import './schema/customer.object-type.js';
import './schema/user-image.object-type.js';
import './schema/user-profile.object-type.js';
import './schema/user-role.object-type.js';
import './schema/user.mutations.js';
import './schema/user.object-type.js';
import './schema/user.queries.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ usersModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {} /* TPL_MODULE_CONTENTS:END */,
    );
