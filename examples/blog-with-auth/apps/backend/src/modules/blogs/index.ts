import { defineAppModule } from '@src/utils/app-modules.js';

import { BLOG_NOTIFICATION_TYPES } from './notifications/blog-notification-types.js';

import './schema/blog-post-like.mutations.js';
/* TPL_IMPORTS:START */
import './schema/blog-post.mutations.js';
import './schema/blog-post.object-type.js';
import './schema/blog-post.queries.js';
import './schema/blog.mutations.js';
import './schema/blog.object-type.js';
import './schema/blog.queries.js';
/* TPL_IMPORTS:END */

export const /* TPL_MODULE_NAME:START */ blogsModule /* TPL_MODULE_NAME:END */ =
    defineAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        notificationTypes: BLOG_NOTIFICATION_TYPES,
      } /* TPL_MODULE_CONTENTS:END */,
    );
