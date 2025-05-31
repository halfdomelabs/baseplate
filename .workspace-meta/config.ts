import {
  defineWorkspaceMetaConfig,
  ensurePackageJson,
  prettierFormatter,
} from 'workspace-meta';

export default defineWorkspaceMetaConfig({
  formatter: prettierFormatter,
  plugins: [
    ensurePackageJson((packageJson) => {
      packageJson.author = packageJson.author ?? 'Your Name';
      packageJson.license = 'UNLICENSED';

      return packageJson;
    }),
  ],
});
