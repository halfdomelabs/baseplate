import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PothosPothosAuthPaths {
  fieldAuthorizeGlobalTypes: string;
  fieldAuthorizePlugin: string;
  fieldAuthorizeTypes: string;
}

const pothosPothosAuthPaths = createProviderType<PothosPothosAuthPaths>(
  'pothos-pothos-auth-paths',
);

const pothosPothosAuthPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { pothosPothosAuthPaths: pothosPothosAuthPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        pothosPothosAuthPaths: {
          fieldAuthorizeGlobalTypes: `${srcRoot}/plugins/graphql/FieldAuthorizePlugin/global-types.ts`,
          fieldAuthorizePlugin: `${srcRoot}/plugins/graphql/FieldAuthorizePlugin/index.ts`,
          fieldAuthorizeTypes: `${srcRoot}/plugins/graphql/FieldAuthorizePlugin/types.ts`,
        },
      },
    };
  },
});

export const POTHOS_POTHOS_AUTH_PATHS = {
  provider: pothosPothosAuthPaths,
  task: pothosPothosAuthPathsTask,
};
