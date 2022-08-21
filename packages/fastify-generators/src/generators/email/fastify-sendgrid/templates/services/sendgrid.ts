// @ts-nocheck

import MailService from '@sendgrid/mail';
import { z } from 'zod';
import { config } from '%config';
import { logger } from '%logger-service';

MailService.setApiKey(config.SENDGRID_API_KEY);

// CUSTOM: Add the default from address here
const DEFAULT_FROM_EMAIL = '<DEFAULT_FROM>';
const DEFAULT_FROM_NAME = '<DEFAULT_FROM_NAME>';

const USE_EMAIL_SANDBOX =
  config.APP_ENVIRONMENT === 'development' || config.APP_ENVIRONMENT === 'test';

interface EmailTemplateConfiguration {
  templateId: string;
  schema: z.ZodSchema;
}

// helper for making strongly-typed template configs
function createTemplateConfig<
  T extends Record<string, EmailTemplateConfiguration>
>(templateConfig: T): T {
  return templateConfig;
}

// CUSTOM: Available Sendgrid templates go here
const SENDGRID_TEMPLATES = createTemplateConfig({
  TEST_TEMPLATE: {
    templateId: 'test-template-id',
    schema: z.object({}),
  },
});

export type SendgridTemplateKey = keyof typeof SENDGRID_TEMPLATES;

interface RenderAndSendTemplateInput<TemplateKey extends SendgridTemplateKey> {
  templateKey: TemplateKey;
  data: z.infer<typeof SENDGRID_TEMPLATES[TemplateKey]['schema']>;
  from?: string;
  to: string;
}

export async function renderAndSendTemplate<
  TemplateKey extends SendgridTemplateKey
>({
  templateKey,
  from,
  data,
  to,
}: RenderAndSendTemplateInput<TemplateKey>): Promise<void> {
  const template = SENDGRID_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`No template found for key ${templateKey}`);
  }

  const validatedData = template.schema.parse(data);

  await MailService.send({
    to,
    from: from || {
      email: DEFAULT_FROM_EMAIL,
      name: DEFAULT_FROM_NAME,
    },
    dynamicTemplateData: validatedData,
    templateId: template.templateId,
    mailSettings: {
      sandboxMode: {
        enable: USE_EMAIL_SANDBOX,
      },
    },
  });

  logger.info(
    `Successfully sent email to ${to} with template ${templateKey}! ${
      USE_EMAIL_SANDBOX ? '(Sandbox)' : ''
    }`
  );
}
