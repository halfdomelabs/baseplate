import { ServerClient } from 'postmark';
import { z } from 'zod';

import { config } from './config.js';

const client = new ServerClient(config.POSTMARK_API_TOKEN);

const DEFAULT_FROM =
  /* TPL_DEFAULT_FROM:START */ '<DEFAULT_FROM>'; /* TPL_DEFAULT_FROM:END */

interface EmailTemplateConfiguration {
  alias: string;
  schema: z.ZodSchema;
}

// helper for making strongly-typed template configs
function createTemplateConfig<
  T extends Record<string, EmailTemplateConfiguration>,
>(templateConfig: T): T {
  return templateConfig;
}

const POSTMARK_TEMPLATES = createTemplateConfig(
  /* TPL_TEMPLATE_CONFIG:START */ {
    TEST_EMAIL: {
      alias: 'test-email',
      schema: z.object({
        name: z.string().min(1),
      }),
    },
  } /* TPL_TEMPLATE_CONFIG:END */,
);

export type PostmarkTemplateKey = keyof typeof POSTMARK_TEMPLATES;

interface RenderAndSendTemplateInput<TemplateKey extends PostmarkTemplateKey> {
  templateKey: TemplateKey;
  data: z.infer<(typeof POSTMARK_TEMPLATES)[TemplateKey]['schema']>;
  from?: string;
  to: string;
}

export async function renderAndSendTemplate<
  TemplateKey extends PostmarkTemplateKey,
>({
  templateKey,
  from,
  data,
  to,
}: RenderAndSendTemplateInput<TemplateKey>): Promise<void> {
  if (!(templateKey in POSTMARK_TEMPLATES)) {
    throw new Error(`No template found for key ${templateKey}`);
  }
  const template = POSTMARK_TEMPLATES[templateKey];

  const validatedData = template.schema.parse(data);

  // Avoid sending emails in tests
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  await client.sendEmailWithTemplate({
    From: from ?? DEFAULT_FROM,
    To: to,
    TemplateAlias: template.alias,
    TemplateModel: validatedData,
  });
}
