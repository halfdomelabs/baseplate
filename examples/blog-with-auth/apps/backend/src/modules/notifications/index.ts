import { defineAppModule } from '@src/utils/app-modules.js';

import { GENERIC_NOTIFICATION_TYPE } from './services/generic-type.js';

/* TPL_IMPORTS:START */
import './schema/notification-content.field.js';
import './schema/notification-content.object-types.js';
import './schema/notification-feed.queries.js';
import './schema/notification.mutations.js';
import './schema/notification.object-type.js';
import './schema/notification.subscriptions.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ notificationsModule /* TPL_MODULE_NAME:END */ =
    defineAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        notificationTypes: [GENERIC_NOTIFICATION_TYPE],
      } /* TPL_MODULE_CONTENTS:END */,
    );
