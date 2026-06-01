import type React from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@baseplate-dev/ui-components';
import {
  MdAdd,
  MdAdminPanelSettings,
  MdClose,
  MdInfoOutline,
  MdLanguage,
  MdStorage,
} from 'react-icons/md';

import type { AppPresetKey, SetupWizardInput } from '../setup-wizard-schema.js';

import { APP_PRESET_KEYS } from '../setup-wizard-schema.js';

interface AppPreset {
  key: AppPresetKey;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
  /**
   * Function that returns the dev port for this preset, given the project's
   * portOffset. Mirrors the formula in `migration-023-assign-app-ports.ts`
   * and `new-dialog.tsx`.
   */
  computePort: (portOffset: number, enabledApps: AppEnablement) => number;
}

interface AppEnablement {
  backend: boolean;
  web: boolean;
  admin: boolean;
}

const APP_PRESETS: AppPreset[] = [
  {
    key: 'backend',
    name: 'backend',
    description: 'Node + Fastify + GraphQL',
    icon: <MdStorage />,
    iconClassName: 'bg-emerald-100 text-emerald-700',
    computePort: (portOffset) => portOffset + 1,
  },
  {
    key: 'web',
    name: 'web',
    description: 'Vite + React user-facing app',
    icon: <MdLanguage />,
    iconClassName: 'bg-sky-100 text-sky-700',
    computePort: (portOffset, enabled) =>
      portOffset + 30 + getWebAlphabeticalIndex('web', enabled),
  },
  {
    key: 'admin',
    name: 'admin',
    description: 'Web app + admin panel',
    icon: <MdAdminPanelSettings />,
    iconClassName: 'bg-violet-100 text-violet-700',
    computePort: (portOffset, enabled) =>
      portOffset + 30 + getWebAlphabeticalIndex('admin', enabled),
  },
];

/**
 * Returns the alphabetical index of `name` among the enabled web-typed apps
 * (both `web` and `admin`). Matches `getNextDevPort` in `new-dialog.tsx`.
 */
function getWebAlphabeticalIndex(
  name: 'web' | 'admin',
  enabled: AppEnablement,
): number {
  const webNames: string[] = [];
  if (enabled.admin) webNames.push('admin');
  if (enabled.web) webNames.push('web');
  webNames.sort();
  return Math.max(webNames.indexOf(name), 0);
}

interface AppsSectionProps {
  setValue: UseFormSetValue<SetupWizardInput>;
  enabledApps: AppEnablement;
  portOffset: number;
}

const REQUIRED_APP_KEYS: ReadonlySet<AppPresetKey> = new Set(['backend']);

export function AppsSection({
  setValue,
  enabledApps,
  portOffset,
}: AppsSectionProps): React.ReactElement {
  const removedKeys = APP_PRESET_KEYS.filter(
    (key) => !enabledApps[key] && !REQUIRED_APP_KEYS.has(key),
  );

  const toggleApp = (key: AppPresetKey, next: boolean): void => {
    setValue(`enabledApps.${key}`, next, { shouldDirty: true });
  };

  const visiblePresets = APP_PRESETS.filter(
    (preset) => enabledApps[preset.key] || REQUIRED_APP_KEYS.has(preset.key),
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Apps
        </div>
        <p className="text-sm text-muted-foreground">
          The apps that make up your monorepo. Each one becomes a folder under{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            apps/
          </code>
          .
        </p>
      </div>

      <div className="space-y-2">
        {visiblePresets.map((preset) => {
          const port = preset.computePort(portOffset, enabledApps);
          return (
            <div
              key={preset.key}
              className="flex items-center gap-3 rounded-lg border bg-card p-4"
            >
              <span
                aria-hidden
                className={`flex size-9 shrink-0 items-center justify-center rounded-md [&_svg]:size-5 ${preset.iconClassName}`}
              >
                {preset.icon}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none font-medium">
                    {preset.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {preset.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center rounded-md border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                  localhost:{port}
                </span>
                {REQUIRED_APP_KEYS.has(preset.key) ? null : (
                  <button
                    type="button"
                    aria-label={`Remove ${preset.name}`}
                    onClick={() => {
                      toggleApp(preset.key, false);
                    }}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <MdClose className="size-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {removedKeys.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="outline" size="sm">
                  <MdAdd className="mr-1 size-4" />
                  Add app
                </Button>
              }
            />
            <DropdownMenuContent align="start">
              {removedKeys.map((key) => {
                const preset = APP_PRESETS.find((p) => p.key === key);
                if (!preset) return null;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => {
                      toggleApp(key, true);
                    }}
                  >
                    <span
                      aria-hidden
                      className={`flex size-5 items-center justify-center rounded [&_svg]:size-3.5 ${preset.iconClassName}`}
                    >
                      {preset.icon}
                    </span>
                    <span>{preset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {preset.description}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled>
            <MdAdd className="mr-1 size-4" />
            Add app
          </Button>
        )}
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MdInfoOutline aria-hidden className="size-3.5" />
          Page titles, ports, and per-app features are configured after the
          project is created.
        </p>
      </div>
    </div>
  );
}
