import { flattenAppModule } from '@src/utils/app-modules.js';

/* TPL_IMPORTS:START */
import './schema/article.mutations.js';
import './schema/article.object-type.js';
import './schema/article.queries.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ articlesModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {} /* TPL_MODULE_CONTENTS:END */,
    );
