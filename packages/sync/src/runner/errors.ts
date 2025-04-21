export class GeneratorTaskStepError extends Error {
  constructor(
    public cause: unknown,
    public taskId: string,
    public step: string,
    public generatorName: string,
  ) {
    super(
      `Error in the ${step} step of the ${generatorName} generator task: ${String(cause)}`,
    );
  }
}
