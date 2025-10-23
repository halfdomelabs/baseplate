import { flattenAppModule } from '@src/utils/app-modules.js';

/* TPL_IMPORTS:START */
import './schema/enums.js';
import './schema/todo-item-attachment-tag.object-type.js';
import './schema/todo-item-attachment.object-type.js';
import './schema/todo-item.mutations.js';
import './schema/todo-item.object-type.js';
import './schema/todo-item.queries.js';
import './schema/todo-list-share.mutations.js';
import './schema/todo-list-share.object-type.js';
import './schema/todo-list-share.queries.js';
import './schema/todo-list.mutations.js';
import './schema/todo-list.object-type.js';
import './schema/todo-list.queries.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ todosModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {} /* TPL_MODULE_CONTENTS:END */,
    );
