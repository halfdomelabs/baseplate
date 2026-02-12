import type { Command } from 'commander';

import { stringifyPrettyStable } from '@baseplate-dev/utils';
import { ZodError } from 'zod';

import { getUserConfig, writeUserConfig } from '../services/user-config.js';

/**
 * Immutably set a deep value in `obj` by `keys` path, returning a new object.
 */
export function setConfigValue(
  obj: Record<string, unknown>,
  keys: string[],
  value: unknown,
): Record<string, unknown> {
  if (keys.length === 0) return obj;
  const [head, ...rest] = keys;
  const existing = obj[head];
  const next =
    rest.length > 0
      ? setConfigValue(
          typeof existing === 'object' && existing !== null
            ? (existing as Record<string, unknown>)
            : {},
          rest,
          value,
        )
      : value;
  return { ...obj, [head]: next };
}

export function addConfigCommand(program: Command): void {
  const configCommand = program
    .command('config')
    .description('Manage user configuration');

  configCommand
    .command('set <path> <value>')
    .description(
      'Set a configuration value e.g. "config set sync.editor vscode"',
    )
    .action(async (path: string, value: string) => {
      const { userConfigSchema } = await import(
        '@baseplate-dev/project-builder-server'
      );

      const currentConfig = await getUserConfig();
      const parsedValue =
        value === 'true' ? true : value === 'false' ? false : value;
      const newConfig = setConfigValue(
        currentConfig,
        path.split('.'),
        parsedValue,
      );

      // Validate the new config before writing
      try {
        const validatedConfig = userConfigSchema.parse(newConfig);
        await writeUserConfig(validatedConfig);
        console.info(stringifyPrettyStable(validatedConfig));
      } catch (err) {
        if (err instanceof ZodError) {
          const error = err.message.includes('Unrecognized key')
            ? new Error(`Unknown configuration key: ${path}`)
            : new Error(`Unable to set configuration key: ${err.message}`);
          throw error;
        }
        throw err;
      }
    });

  configCommand
    .command('get')
    .description('Get the current configuration')
    .action(async () => {
      const config = await getUserConfig();
      console.info(stringifyPrettyStable(config));
    });
}
