import { flattenAppModule } from '../utils/app-modules.js';
import { accountsModule } from './accounts/index.js';
import { authModule } from './auth/index.js';
import { blogsModule } from './blogs/index.js';
import { graphqlModule } from './graphql/index.js';
import { utilitiesModule } from './utilities/index.js';

/* TPL_IMPORTS:BLOCK */

export const /* TPL_MODULE_NAME:START */ rootModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        children: [
          accountsModule,
          authModule,
          blogsModule,
          graphqlModule,
          utilitiesModule,
        ],
      } /* TPL_MODULE_CONTENTS:END */,
    );
