import { flattenAppModule } from '@src/utils/app-modules.js';

import { validateNotificationRegistry } from './services/notification-channel.js';

/* TPL_IMPORTS:START */
import './schema/notification-content.field.js';
import './schema/notification.mutations.js';
import './schema/notification.object-type.js';
import './schema/notification.queries.js';
import './schema/notification.subscriptions.js';
import './services/generic-type.js';
/* TPL_IMPORTS:END */
import './services/in-app-channel.js';

// Fail fast if a type declares a channel nobody registered — otherwise those
// notifications would be silently undeliverable on that channel.
validateNotificationRegistry();

export const /* TPL_MODULE_NAME:START */ notificationsModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {} /* TPL_MODULE_CONTENTS:END */,
    );
