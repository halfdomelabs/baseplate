// @ts-nocheck

import { bullBoardPlugin } from './plugins/bull-board';
import * as AuthenticateBullBoardMutations from './schema/authenticate-bull-board';

export const bullBoardModule = {
  schemaTypes: [AuthenticateBullBoardMutations],
  plugins: [bullBoardPlugin],
};
