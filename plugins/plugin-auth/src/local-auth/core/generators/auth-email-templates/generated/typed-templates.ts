import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { transactionalLibImportsProvider } from '@baseplate-dev/plugin-email';
import path from 'node:path';

const accountVerificationEmail = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    transactionalLibImports: transactionalLibImportsProvider,
  },
  name: 'account-verification-email',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/emails/auth/account-verification.email.tsx',
    ),
  },
  variables: {},
});

const passwordChangedEmail = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    transactionalLibImports: transactionalLibImportsProvider,
  },
  name: 'password-changed-email',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/emails/auth/password-changed.email.tsx',
    ),
  },
  variables: {},
});

const passwordResetEmail = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    transactionalLibImports: transactionalLibImportsProvider,
  },
  name: 'password-reset-email',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/emails/auth/password-reset.email.tsx',
    ),
  },
  variables: {},
});

export const LOCAL_AUTH_AUTH_EMAIL_TEMPLATES_TEMPLATES = {
  accountVerificationEmail,
  passwordChangedEmail,
  passwordResetEmail,
};
