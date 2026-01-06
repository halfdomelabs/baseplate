import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { stringify } from 'yaml';
import { z } from 'zod';

const descriptorSchema = z.object({
  /**
   * Workspace package patterns to include in pnpm-workspace.yaml
   *
   * Each pattern specifies a glob that matches workspace packages.
   * @example ['apps/*', 'packages/*']
   */
  packages: z.array(z.string()).default([]),
});

/**
 * Generator for pnpm-workspace.yaml
 *
 * Creates the pnpm-workspace.yaml file that tells pnpm which directories
 * contain workspace packages.
 */
export const pnpmWorkspaceGenerator = createGenerator({
  name: 'node/pnpm-workspace',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      run() {
        return {
          build: (builder) => {
            const yamlContent = stringify({
              packages: descriptor.packages,
              // blocks dependencies from resolving to exotic (non-npm) subdependencies
              // unless explicitly allowed, preventing supply chain attacks via git/http deps
              blockExoticSubdeps: true,
              // ensures we use locally linked packages when available
              linkWorkspacePackages: true,
              // security setting to delay installation of newly released dependencies
              // to reduce risk of installing compromised packages. Popular packages that are
              // successfully attacked are often discovered and removed from the registry
              // within an hour. Setting to 1440 minutes (24 hours) ensures only packages
              // released at least one day ago can be installed.
              minimumReleaseAge: 1440,
              // prevents publish from any branch other than main
              publishBranch: 'main',
              // saves exact versions of dependencies by default
              savePrefix: '',
              // defaults to saving as workspace:*
              saveWorkspaceProtocol: 'rolling',
              // prevents automatic trust downgrades - maintains security trust levels
              // and requires explicit action to reduce trust for packages
              trustPolicy: 'no-downgrade',
            });

            builder.writeFile({
              id: 'pnpm-workspace',
              destination: 'pnpm-workspace.yaml',
              contents: yamlContent,
            });
          },
        };
      },
    }),
  }),
});
