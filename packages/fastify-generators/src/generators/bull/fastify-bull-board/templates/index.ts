// @ts-nocheck

import { bullBoardPlugin } from './plugins/bull-board';

import './schema/authenticate.mutations';

export const bullBoardModule = {
  plugins: [bullBoardPlugin],
};
