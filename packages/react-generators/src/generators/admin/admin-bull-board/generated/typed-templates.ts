import {
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import path from 'node:path';

import { generatedGraphqlImportsProvider } from '#src/generators/apollo/react-apollo/providers/generated-graphql.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactConfigImportsProvider } from '#src/generators/core/react-config/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

const bullBoard = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'bull-board',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/bull-board/bull-board.gql',
    ),
  },
  variables: {},
});

const bullBoardPage = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactConfigImports: reactConfigImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
  },
  name: 'bull-board-page',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/routes/bull-board/index.tsx',
    ),
  },
  variables: { TPL_ROUTE_PATH: {} },
});

export const ADMIN_ADMIN_BULL_BOARD_TEMPLATES = { bullBoard, bullBoardPage };
