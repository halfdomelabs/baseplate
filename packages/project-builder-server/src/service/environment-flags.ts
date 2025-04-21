// Environment flags that can change behavior of the project builder server

export const environmentFlags = {
  /**
   * Whether to write the generator steps JSON file
   */
  BASEPLATE_WRITE_GENERATOR_STEPS_JSON:
    !!process.env.BASEPLATE_WRITE_GENERATOR_STEPS_JSON,
  /**
   * The custom merge driver to use
   *
   * See https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver
   */
  BASEPLATE_CUSTOM_MERGE_DRIVER: process.env.BASEPLATE_CUSTOM_MERGE_DRIVER,
};
