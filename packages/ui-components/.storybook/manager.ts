import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

import customTheme from './custom-theme.js';

interface Globals {
  theme: 'light' | 'dark' | undefined;
}

addons.register('dark-mode', (api) => {
  let previousTheme: string | undefined = undefined;

  function updateTheme(newTheme?: string): void {
    const nextTheme = newTheme ?? (api.getGlobals() as Globals).theme;
    if (nextTheme === previousTheme) return;
    previousTheme = nextTheme;

    addons.setConfig({
      theme: {
        ...(nextTheme === 'dark' ? themes.dark : themes.light),
        ...customTheme,
      },
    });
  }
  api.on(GLOBALS_UPDATED, (eventData) => {
    updateTheme((eventData as { globals: Globals }).globals.theme);
  });
  updateTheme();
});
