export interface ProjectBuilderTest {
  /**
   * Path of project relative to root baseplate repo tests directory
   *
   * baseplate/tests/<directory>
   */
  projectDirectory: string;
  runTests: () => Promise<void>;
}
