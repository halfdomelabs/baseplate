import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  RadioGroup,
  RadioGroupItem,
} from '@baseplate-dev/ui-components';
import { useId, useMemo } from 'react';
import {
  MdAutoAwesome,
  MdBugReport,
  MdCloudUpload,
  MdCreditCard,
  MdLock,
  MdMail,
  MdWorkOutline,
} from 'react-icons/md';

import type {
  SetupWizardData,
  SetupWizardInput,
} from '../setup-wizard-schema.js';

import {
  AUTH_PLUGIN_FQN,
  DEV_AGENTS_PLUGIN_FQN,
  EMAIL_PLUGIN_FQN,
  QUEUE_PLUGIN_FQN,
  SENTRY_PLUGIN_FQN,
  STORAGE_PLUGIN_FQN,
  STRIPE_PLUGIN_FQN,
} from '../plugin-fqns.js';
import { PluginRow } from './plugin-row.js';

interface ProviderOption<V extends string> {
  value: V;
  title: string;
  subtitle: string;
  learnMoreUrl?: string;
}

const AUTH_METHOD_OPTIONS: ProviderOption<'local-auth' | 'better-auth'>[] = [
  {
    value: 'local-auth',
    title: 'Baseplate Auth',
    subtitle: 'Baseplate built authentication that is fully customizable.',
  },
  {
    value: 'better-auth',
    title: 'Better Auth',
    subtitle: 'OAuth providers, passkeys, magic links, and more.',
    learnMoreUrl: 'https://www.better-auth.com',
  },
];

const EMAIL_PROVIDER_OPTIONS: ProviderOption<'postmark' | 'resend' | 'stub'>[] =
  [
    {
      value: 'postmark',
      title: 'Postmark',
      subtitle: 'Production-ready transactional email.',
      learnMoreUrl: 'https://postmarkapp.com',
    },
    {
      value: 'resend',
      title: 'Resend',
      subtitle: 'Modern, developer-friendly email API.',
      learnMoreUrl: 'https://resend.com',
    },
    {
      value: 'stub',
      title: 'Stub (dev only)',
      subtitle:
        'Logs emails to the console that you can replace with your own provider.',
    },
  ];

const QUEUE_PROVIDER_OPTIONS: ProviderOption<'pg-boss' | 'bullmq'>[] = [
  {
    value: 'pg-boss',
    title: 'pg-boss',
    subtitle: 'Uses your existing Postgres database — no extra infrastructure.',
    learnMoreUrl: 'https://github.com/timgit/pg-boss',
  },
  {
    value: 'bullmq',
    title: 'BullMQ',
    subtitle: 'High-throughput job processing, backed by Redis.',
    learnMoreUrl: 'https://bullmq.io',
  },
];

interface ProviderRadioGroupProps<V extends string> {
  label: string;
  value: V;
  options: ProviderOption<V>[];
  onChange: (next: V) => void;
}

function ProviderRadioGroup<V extends string>({
  label,
  value,
  options,
  onChange,
}: ProviderRadioGroupProps<V>): React.ReactElement {
  const groupId = useId();
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <RadioGroup
        value={value}
        onValueChange={(next) => {
          if (next === null) return;
          onChange(next as V);
        }}
      >
        {options.map((option) => {
          const itemId = `${groupId}-${option.value}`;
          return (
            <Field key={option.value} orientation="horizontal">
              <RadioGroupItem value={option.value} id={itemId} />
              <FieldContent>
                <FieldLabel htmlFor={itemId}>{option.title}</FieldLabel>
                <FieldDescription>
                  {option.subtitle}
                  {option.learnMoreUrl ? (
                    <>
                      {' '}
                      <a
                        href={option.learnMoreUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        Learn more
                      </a>
                    </>
                  ) : null}
                </FieldDescription>
              </FieldContent>
            </Field>
          );
        })}
      </RadioGroup>
    </div>
  );
}

function hasPlugin(plugins: PluginMetadataWithPaths[], fqn: string): boolean {
  return plugins.some((p) => p.fullyQualifiedName === fqn);
}

interface StackListProps {
  setValue: UseFormSetValue<SetupWizardInput>;
  plugins: PluginMetadataWithPaths[];
  values: Pick<
    SetupWizardData,
    | 'enableAuth'
    | 'authMethod'
    | 'enableEmail'
    | 'emailProvider'
    | 'enableQueue'
    | 'queueImplementation'
    | 'enableStorage'
    | 'enableObservability'
    | 'enablePayments'
    | 'enableAi'
  >;
}

export function StackList({
  setValue,
  plugins,
  values,
}: StackListProps): React.ReactElement | null {
  const available = useMemo(
    () => ({
      auth: hasPlugin(plugins, AUTH_PLUGIN_FQN),
      email: hasPlugin(plugins, EMAIL_PLUGIN_FQN),
      queue: hasPlugin(plugins, QUEUE_PLUGIN_FQN),
      storage: hasPlugin(plugins, STORAGE_PLUGIN_FQN),
      payments: hasPlugin(plugins, STRIPE_PLUGIN_FQN),
      observability: hasPlugin(plugins, SENTRY_PLUGIN_FQN),
      ai: hasPlugin(plugins, DEV_AGENTS_PLUGIN_FQN),
    }),
    [plugins],
  );

  if (!Object.values(available).some(Boolean)) return null;

  const emailForcedByAuth = values.enableAuth && available.email;
  const queueForcedByAuth =
    values.enableAuth && values.authMethod === 'local-auth';
  const queueForced =
    queueForcedByAuth || values.enableEmail || values.enableStorage;
  const queueForcedReason = queueForcedByAuth
    ? 'Authentication'
    : values.enableEmail
      ? 'Email'
      : 'File storage';
  const showQueueRow = available.queue && (queueForced || values.enableQueue);

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Your stack
      </div>
      <div className="space-y-2">
        {available.auth ? (
          <PluginRow
            icon={<MdLock />}
            title="Authentication"
            description="User accounts, sign-in, and roles."
            enabled={values.enableAuth}
            onToggle={(checked) => {
              setValue('enableAuth', checked);
              if (checked) {
                setValue('enableEmail', true);
              } else {
                setValue('enableStorage', false);
                setValue('enablePayments', false);
              }
            }}
            expandable
            defaultOpen
          >
            <ProviderRadioGroup
              label="Provider"
              value={values.authMethod}
              options={AUTH_METHOD_OPTIONS}
              onChange={(next) => {
                setValue('authMethod', next);
              }}
            />
          </PluginRow>
        ) : null}

        {available.email ? (
          <PluginRow
            icon={<MdMail />}
            title="Email"
            description="Send transactional email."
            enabled={values.enableEmail}
            onToggle={(checked) => {
              setValue('enableEmail', checked);
            }}
            disabledToggle={emailForcedByAuth}
            forcedByLabel={emailForcedByAuth ? 'Authentication' : undefined}
            expandable
            defaultOpen={emailForcedByAuth}
          >
            <ProviderRadioGroup
              label="Provider"
              value={values.emailProvider}
              options={EMAIL_PROVIDER_OPTIONS}
              onChange={(next) => {
                setValue('emailProvider', next);
              }}
            />
          </PluginRow>
        ) : null}

        {showQueueRow ? (
          <PluginRow
            icon={<MdWorkOutline />}
            title="Background queue"
            description="Run jobs asynchronously."
            enabled={values.enableQueue || queueForced}
            onToggle={(checked) => {
              setValue('enableQueue', checked);
            }}
            disabledToggle={queueForced}
            forcedByLabel={queueForced ? queueForcedReason : undefined}
            expandable
            defaultOpen={queueForced}
          >
            <ProviderRadioGroup
              label="Provider"
              value={values.queueImplementation}
              options={QUEUE_PROVIDER_OPTIONS}
              onChange={(next) => {
                setValue('queueImplementation', next);
              }}
            />
          </PluginRow>
        ) : null}

        {available.storage ? (
          <PluginRow
            icon={<MdCloudUpload />}
            title="File storage"
            description={
              values.enableAuth
                ? 'Upload, store, and serve user files.'
                : 'Upload, store, and serve user files. (Requires authentication)'
            }
            enabled={values.enableStorage}
            onToggle={(checked) => {
              setValue('enableStorage', checked);
            }}
            disabledToggle={!values.enableAuth}
          />
        ) : null}

        {available.payments ? (
          <PluginRow
            icon={<MdCreditCard />}
            title="Payments"
            description={
              values.enableAuth
                ? 'Stripe checkout, subscriptions, billing.'
                : 'Stripe checkout, subscriptions, billing. (Requires authentication)'
            }
            enabled={values.enablePayments}
            onToggle={(checked) => {
              setValue('enablePayments', checked);
            }}
            disabledToggle={!values.enableAuth}
          />
        ) : null}

        {available.observability ? (
          <PluginRow
            icon={<MdBugReport />}
            title="Error tracking"
            description="Sentry for errors and performance."
            enabled={values.enableObservability}
            onToggle={(checked) => {
              setValue('enableObservability', checked);
            }}
          />
        ) : null}

        {available.ai ? (
          <PluginRow
            icon={<MdAutoAwesome />}
            title="AI dev agents"
            description="Generate context for Claude Code, Cursor, & friends."
            enabled={values.enableAi}
            onToggle={(checked) => {
              setValue('enableAi', checked);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
