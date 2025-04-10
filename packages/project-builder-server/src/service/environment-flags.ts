// Environment flags that can change behavior of the project builder server

export const environmentFlags = {
  /**
   * Whether to write the generator steps JSON file
   */
  BASEPLATE_WRITE_GENERATOR_STEPS_JSON:
    !!process.env.BASEPLATE_WRITE_GENERATOR_STEPS_JSON,
};
