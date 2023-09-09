import { z } from 'zod';

export const DASHED_NAME = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9-]+$/,
    'The name should be all lowercase letters, numbers, and dashes, e.g. my-project',
  );
