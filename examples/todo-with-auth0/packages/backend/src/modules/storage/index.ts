import { flattenAppModule } from '@src/utils/app-modules.js';

/* TPL_IMPORTS:START */
import './schema/file-category.enum.js';
import './schema/file-input.input-type.js';
import './schema/file.object-type.js';
import './schema/file.queries.js';
import './schema/presigned.mutations.js';
import './schema/public-url.field.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ storageModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {} /* TPL_MODULE_CONTENTS:END */,
    );
