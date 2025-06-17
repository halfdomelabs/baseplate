// @ts-nocheck

import { bullBoardPlugin } from './plugins/bull-board.js';

import './schema/authenticate.mutations.js';

export const bullBoardModule = {
  plugins: [bullBoardPlugin],
};
