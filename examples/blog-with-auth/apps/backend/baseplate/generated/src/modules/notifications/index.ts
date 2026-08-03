import { defineAppModule } from '@src/utils/app-modules.js';

import { notificationDeliveryWorker } from './queues/notification-delivery.worker.js';
import { notificationOutboxSweepWorker } from './queues/notification-outbox-sweep.worker.js';
import { notificationRetentionWorker } from './queues/notification-retention.worker.js';
import { GENERIC_NOTIFICATION_TYPE } from './services/generic-type.js';

/* TPL_IMPORTS:START */
import './schema/notification-content.field.js';
import './schema/notification-content.object-types.js';
import './schema/notification-feed.queries.js';
import './schema/notification-preference.schema.js';
import './schema/notification.mutations.js';
import './schema/notification.object-type.js';
import './schema/notification.subscriptions.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ notificationsModule /* TPL_MODULE_NAME:END */ =
    defineAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        notificationTypes: [GENERIC_NOTIFICATION_TYPE],
        queues: [
          notificationDeliveryWorker,
          notificationOutboxSweepWorker,
          notificationRetentionWorker,
        ],
      } /* TPL_MODULE_CONTENTS:END */,
    );
