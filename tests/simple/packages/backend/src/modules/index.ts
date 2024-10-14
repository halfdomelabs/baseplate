import { flattenAppModule } from '../utils/app-modules.js';
import { blogModule } from './blog/index.js';
import { graphqlModule } from './graphql/index.js';

export const RootModule = flattenAppModule({
  children: [blogModule, graphqlModule],
});
