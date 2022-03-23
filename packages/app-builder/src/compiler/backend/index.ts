// async function write backend

import { ProjectEntry } from '../../types/files';
import type { AppConfig } from '../schema';

export function compileBackend(appConfig: AppConfig): ProjectEntry {
  const projectJson = {
    generator: '@baseplate/core/node/node',
    name: appConfig.name,
    description: `Backend for ${appConfig.name}`,
  };

  return {
    name: 'backend',
    files: [
      {
        path: 'baseplate/project.json',
        jsonContent: projectJson,
      },
    ],
    rootDirectory: 'packages/backend',
  };
}
