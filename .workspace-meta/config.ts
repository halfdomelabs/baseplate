import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  defineWorkspaceMetaConfig,
  ensureFile,
  ensurePackageJson,
  prettierFormatter,
} from 'workspace-meta';

export default defineWorkspaceMetaConfig({
  formatter: (content, filename) => {
    if (filename.endsWith('LICENSE')) {
      return content;
    }

    return prettierFormatter(content, filename);
  },
  plugins: [
    ensureFile(
      'LICENSE',
      readFileSync(
        path.join(import.meta.dirname, 'templates', 'LICENSE'),
        'utf8',
      ),
    ),
    ensurePackageJson((packageJson) => {
      packageJson.author = 'Half Dome Labs LLC';
      packageJson.license = 'MPL-2.0';
      packageJson.homepage = 'https://www.baseplate.dev';

      if (!packageJson.private) {
        packageJson.publishConfig = {
          access: 'public',
          provenance: true,
        } as { access: 'public' };
      }

      return packageJson;
    }),
  ],
});
