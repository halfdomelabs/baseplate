import { flattenAppModule } from '../utils/app-modules';
import { blogModule } from './blog';
import { graphqlModule } from './graphql';

export const RootModule = flattenAppModule({
  children: [blogModule, graphqlModule],
});
