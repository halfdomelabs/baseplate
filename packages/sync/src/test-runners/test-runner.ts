import type { GeneratorInfo } from '@src/generators/build-generator-entry.js';
import type {
  GeneratorTask,
  GeneratorTaskResult,
  InferDependencyProviderMap,
  InferExportProviderMap,
  ProviderDependencyMap,
  ProviderExportMap,
} from '@src/generators/generators.js';
import type { PostWriteCommand } from '@src/output/index.js';

import {
  type GeneratorTaskOutput,
  GeneratorTaskOutputBuilder,
} from '@src/output/generator-task-output.js';

interface TaskTestRunnerResult<
  ExportMap extends ProviderExportMap | undefined,
  OutputMap extends ProviderExportMap | undefined,
> {
  exports: InferExportProviderMap<ExportMap>;
  outputs: InferExportProviderMap<OutputMap>;
  builderOutputs: GeneratorTaskOutput;
  getFileOutputContents(path: string): string | undefined;
  getPostWriteCommand(command: string): PostWriteCommand | undefined;
}

interface TaskTestRunner<
  ExportMap extends ProviderExportMap | undefined,
  DependencyMap extends ProviderDependencyMap,
  OutputMap extends ProviderExportMap | undefined,
> {
  run(
    dependencies: InferDependencyProviderMap<DependencyMap>,
    executeOnProviders?: (
      providers: InferExportProviderMap<ExportMap>,
    ) => Promise<void> | void,
  ): Promise<TaskTestRunnerResult<ExportMap, OutputMap>>;
}

interface CreateTaskTestRunnerOptions {
  taskId?: string;
  generatorId?: string;
  generatorInfo?: GeneratorInfo;
}

export function createTaskTestRunner<
  ExportMap extends ProviderExportMap | undefined,
  DependencyMap extends ProviderDependencyMap,
  OutputMap extends ProviderExportMap | undefined,
>(
  task: GeneratorTask<ExportMap, DependencyMap, OutputMap>,
  {
    taskId = 'test-task#main',
    generatorId = '@halfdomelabs/test-runner:test-generator',
    generatorInfo = {
      name: 'test-generator',
      baseDirectory: '/',
    },
  }: CreateTaskTestRunnerOptions = {},
): TaskTestRunner<ExportMap, DependencyMap, OutputMap> {
  return {
    async run(dependencies, executeOnProviders) {
      // run init step
      const initResult = task.run(dependencies, {
        taskId,
      }) as
        | GeneratorTaskResult<
            InferExportProviderMap<ExportMap>,
            InferExportProviderMap<OutputMap>
          >
        | undefined;

      const providers =
        initResult && 'providers' in initResult ? initResult.providers : {};

      await Promise.resolve(
        executeOnProviders?.(providers as InferExportProviderMap<ExportMap>),
      );

      const builder = new GeneratorTaskOutputBuilder({
        generatorInfo,
        generatorId,
      });

      const buildResult = await Promise.resolve(initResult?.build?.(builder));

      return {
        exports: providers as InferExportProviderMap<ExportMap>,
        outputs: buildResult as InferExportProviderMap<OutputMap>,
        builderOutputs: builder.output,
        getFileOutputContents(path) {
          const contents = builder.output.files.get(path)?.contents;
          if (!contents) return contents;
          return typeof contents === 'string'
            ? contents
            : contents.toString('utf8');
        },
        getPostWriteCommand(command) {
          return builder.output.postWriteCommands.find(
            (cmd) => cmd.command === command,
          );
        },
      };
    },
  };
}
