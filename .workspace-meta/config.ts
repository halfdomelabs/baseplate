import {
  defineWorkspaceMetaConfig,
  ensurePackageJson,
  prettierFormatter,
} from 'workspace-meta';

export default defineWorkspaceMetaConfig({
  formatter: prettierFormatter,
  plugins: [
    ensurePackageJson((packageJson) => {
      packageJson.author = 'Half Dome Labs LLC';

      return packageJson;
    }),
  ],
});
