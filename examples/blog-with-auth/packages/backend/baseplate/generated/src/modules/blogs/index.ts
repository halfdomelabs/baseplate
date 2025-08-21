import { flattenAppModule } from '@src/utils/app-modules.js';

/* TPL_IMPORTS:START */
import './schema/blog.object-type.js';
import './schema/blog.queries.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ blogsModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {} /* TPL_MODULE_CONTENTS:END */,
    );
