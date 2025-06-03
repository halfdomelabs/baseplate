import { createTsTemplateFile } from '@baseplate-dev/core-generators';

import { generatedGraphqlImportsProvider } from '../../../apollo/react-apollo/generated/ts-import-maps.js';
import { reactComponentsImportsProvider } from '../../../core/react-components/generated/ts-import-maps.js';
import { reactConfigImportsProvider } from '../../../core/react-config/generated/ts-import-maps.js';
import { reactErrorImportsProvider } from '../../../core/react-error/generated/ts-import-maps.js';

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
