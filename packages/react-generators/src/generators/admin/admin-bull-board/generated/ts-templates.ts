import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { generatedGraphqlImportsProvider } from '../../../apollo/react-apollo/index.js';
import { reactComponentsImportsProvider } from '../../../core/react-components/index.js';
import { reactConfigImportsProvider } from '../../../core/react-config/index.js';
import { reactErrorImportsProvider } from '../../../core/react-error/index.js';

const bullBoardPage = createTsTemplateFile({
  importMapProviders: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactConfigImports: reactConfigImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'bull-board-page',
  projectExports: {},
  source: { path: 'bull-board.page.tsx' },
  variables: {},
});

export const ADMIN_ADMIN_BULL_BOARD_TS_TEMPLATES = { bullBoardPage };
