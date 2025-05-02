import { createTextTemplateFile } from '@halfdomelabs/sync';

const bullBoard = createTextTemplateFile({
  name: 'bull-board',
  source: { path: 'bull-board.gql' },
  variables: {},
});

export const ADMIN_ADMIN_BULL_BOARD_TEXT_TEMPLATES = {
  bullBoard,
};
