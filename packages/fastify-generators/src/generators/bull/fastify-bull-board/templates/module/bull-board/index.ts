// @ts-nocheck

import { bullBoardPlugin } from '$pluginsBullBoard';

import './schema/authenticate.mutations.js';

export const bullBoardModule = {
  plugins: [bullBoardPlugin],
};
