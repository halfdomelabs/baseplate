import { flattenAppModule } from '@src/utils/app-modules.js';

import './scalars/date-time.js';
import './scalars/date.js';
import './scalars/uuid.js';

export const graphqlModule = flattenAppModule({});
