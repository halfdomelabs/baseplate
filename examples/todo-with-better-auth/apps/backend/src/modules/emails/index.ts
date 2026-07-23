import { defineAppModule } from '@src/utils/app-modules.js';

import { sendEmailWorker } from './queues/send-email.worker.js';

export const emailsModule = defineAppModule({
  queues: [sendEmailWorker],
});
