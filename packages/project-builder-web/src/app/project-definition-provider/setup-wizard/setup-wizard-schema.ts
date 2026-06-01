import { generalSettingsSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const APP_PRESET_KEYS = ['backend', 'web', 'admin'] as const;
export type AppPresetKey = (typeof APP_PRESET_KEYS)[number];

export const setupWizardSchema = generalSettingsSchema
  .extend({
    enabledApps: z
      .object({
        backend: z.boolean().default(true),
        web: z.boolean().default(true),
        admin: z.boolean().default(true),
      })
      .default({ backend: true, web: true, admin: true }),
    enableAuth: z.boolean().default(true),
    authMethod: z.enum(['better-auth', 'local-auth']).default('local-auth'),
    enableEmail: z.boolean().default(true),
    emailProvider: z.enum(['postmark', 'resend', 'stub']).default('postmark'),
    enableQueue: z.boolean().default(false),
    queueImplementation: z.enum(['pg-boss', 'bullmq']).default('pg-boss'),
    enableStorage: z.boolean().default(false),
    enableObservability: z.boolean().default(true),
    enablePayments: z.boolean().default(false),
    enableAi: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.enableAuth && !data.enableEmail) {
      ctx.addIssue({
        code: 'custom',
        message: 'Email is required for authentication',
        path: ['enableEmail'],
      });
    }
  });

export type SetupWizardInput = z.input<typeof setupWizardSchema>;
export type SetupWizardData = z.output<typeof setupWizardSchema>;
