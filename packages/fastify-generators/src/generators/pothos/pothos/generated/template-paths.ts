import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface PothosPothosPaths {
  builder: string;
  fieldWithInputGlobalTypes: string;
  fieldWithInputPlugin: string;
  fieldWithInputSchemaBuilder: string;
  fieldWithInputTypes: string;
  stripQueryMutationPlugin: string;
}

const pothosPothosPaths = createProviderType<PothosPothosPaths>(
  'pothos-pothos-paths',
);

const pothosPothosPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { pothosPothosPaths: pothosPothosPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        pothosPothosPaths: {
          builder: `${srcRoot}/plugins/graphql/builder.ts`,
          fieldWithInputGlobalTypes: `${srcRoot}/plugins/graphql/FieldWithInputPayloadPlugin/global-types.ts`,
          fieldWithInputPlugin: `${srcRoot}/plugins/graphql/FieldWithInputPayloadPlugin/index.ts`,
          fieldWithInputSchemaBuilder: `${srcRoot}/plugins/graphql/FieldWithInputPayloadPlugin/schema-builder.ts`,
          fieldWithInputTypes: `${srcRoot}/plugins/graphql/FieldWithInputPayloadPlugin/types.ts`,
          stripQueryMutationPlugin: `${srcRoot}/plugins/graphql/strip-query-mutation-plugin.ts`,
        },
      },
    };
  },
});

export const POTHOS_POTHOS_PATHS = {
  provider: pothosPothosPaths,
  task: pothosPothosPathsTask,
};
