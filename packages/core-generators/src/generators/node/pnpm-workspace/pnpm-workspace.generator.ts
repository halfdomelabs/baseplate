import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { compareStrings } from '@baseplate-dev/utils';
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
  /**
   * Map of package names to whether their install/build scripts are approved.
   *
   * pnpm 11's approve-builds gate blocks packages with build scripts unless
   * they are explicitly allowed here. Set `true` to pre-approve a package's
   * build so it runs on install without an interactive prompt.
   *
   * Note: `strictDepBuilds` is set to `false` (see below), so build-script
   * dependencies that are NOT listed here are still installed successfully —
   * they simply emit a non-fatal warning instead of failing the install.
   * @example { '@prisma/engines': true, prisma: true }
   */
  allowBuilds: z.record(z.string(), z.boolean()).default({}),
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
            const allowBuildsEntries = Object.entries(descriptor.allowBuilds);
            const sortedAllowBuilds =
              allowBuildsEntries.length > 0
                ? Object.fromEntries(
                    allowBuildsEntries.toSorted(([a], [b]) =>
                      compareStrings(a, b),
                    ),
                  )
                : undefined;

            const yamlContent = stringify({
              packages: descriptor.packages,
              // pre-approves the listed packages' install/build scripts so pnpm
              // 11's approve-builds gate runs them without an interactive prompt
              // (e.g. Prisma's engine). Omitted entirely when empty.
              ...(sortedAllowBuilds ? { allowBuilds: sortedAllowBuilds } : {}),
              // do not fail the install when a dependency has an unapproved
              // build script; pnpm still installs it and only emits a warning.
              // This keeps `pnpm install` / `pnpm baseplate serve` working on a
              // freshly generated project without the user having to identify
              // and approve each build-script dependency by hand.
              strictDepBuilds: false,
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
