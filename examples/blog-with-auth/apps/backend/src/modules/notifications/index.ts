import { defineAppModule } from '@src/utils/app-modules.js';

/* TPL_IMPORTS:START */
import './schema/notification-content.field.js';
import './schema/notification-content.object-types.js';
import './schema/notification.mutations.js';
import './schema/notification.object-type.js';
import './schema/notification.queries.js';
import './schema/notification.subscriptions.js';
import './services/generic-type.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ notificationsModule /* TPL_MODULE_NAME:END */ =
    defineAppModule(
      /* TPL_MODULE_CONTENTS:START */ {} /* TPL_MODULE_CONTENTS:END */,
    );
