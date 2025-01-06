// Environment flags that can change behavior of the project builder server

export const environmentFlags = {
  BASEPLATE_WRITE_GENERATOR_STEPS_HTML:
    !!process.env.BASEPLATE_WRITE_GENERATOR_STEPS_HTML,
};
