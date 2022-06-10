import { z } from 'zod';

export const baseAdminSectionValidators = {
  uid: z.string().min(1),
  title: z.string(),
  icon: z.string(),
  feature: z.string(),
  type: z.string(),
};
