import { flattenAppModule } from '../utils/app-modules.js';
import { accountsModule } from './accounts/index.js';
import { bullBoardModule } from './bull-board/index.js';
import { graphqlModule } from './graphql/index.js';
import { storageModule } from './storage/index.js';
import { todosModule } from './todos/index.js';

/* TPL_IMPORTS:BLOCK */

export const /* TPL_MODULE_NAME:START */ rootModule /* TPL_MODULE_NAME:END */ =
    flattenAppModule(
      /* TPL_MODULE_CONTENTS:START */ {
        children: [
          accountsModule,
          bullBoardModule,
          graphqlModule,
          storageModule,
          todosModule,
        ],
      } /* TPL_MODULE_CONTENTS:END */,
    );
