import type { DocsContainerProps } from '@storybook/addon-docs/blocks';
import type { Preview, ReactRenderer } from '@storybook/react-vite';
import type React from 'react';

import { DocsContainer } from '@storybook/addon-docs/blocks';
import { withThemeByClassName } from '@storybook/addon-themes';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';
import { themes } from 'storybook/theming';

import { Toaster } from '../src/components/ui/toaster/toaster.js';

import '../src/styles.css';

// We need to make sure toaster only renders once per page

let hasToasterRendered = false;

const ToasterPortal = (): React.JSX.Element | null => {
  const [shouldRender, setShouldRender] = useState(false);
  useEffect(() => {
    if (hasToasterRendered) return;
    hasToasterRendered = true;
    setShouldRender(true);
    return () => {
      hasToasterRendered = false;
    };
  }, []);
  if (!shouldRender) return null;
  return createPortal(<Toaster />, document.body);
};

/**
 * A palette whose page, card and popover colours are deliberately far apart.
 *
 * The default palette resolves `--background` and `--card` to nearly the same
 * colour, which hides every bug in the control and panel tokens: a control that
 * forgot `bg-control-background` looks identical to one that has it.
 *
 * Applied to the document element rather than a wrapper, because dialogs,
 * popovers and toasts portal out of the story and would otherwise keep the
 * default palette — they are the components the stress palette exists to check.
 */
const SPLIT_PALETTE: Record<string, string> = {
  '--background': 'oklch(0.94 0.005 265)',
  '--card': 'oklch(1 0 0)',
  '--popover': 'oklch(0.99 0.004 265)',
};

const usePaletteStress = (palette: string): void => {
  useEffect(() => {
    if (palette !== 'split') return;
    const { style } = document.documentElement;
    for (const [name, value] of Object.entries(SPLIT_PALETTE)) {
      style.setProperty(name, value);
    }
    return () => {
      for (const name of Object.keys(SPLIT_PALETTE)) {
        style.removeProperty(name);
      }
    };
  }, [palette]);
};

// Keep track of the current theme

let currentTheme: 'light' | 'dark' | undefined;

const channel = addons.getChannel();

interface Globals {
  theme: 'light' | 'dark' | undefined;
}

channel.on(GLOBALS_UPDATED, (eventData) => {
  currentTheme = (eventData as { globals: Globals }).globals.theme;
});

function ThemedDocsContainer(
  props: DocsContainerProps<ReactRenderer> & { children: React.ReactNode },
): React.JSX.Element {
  const theme =
    currentTheme === undefined
      ? undefined
      : currentTheme === 'dark'
        ? themes.dark
        : themes.light;
  return (
    <DocsContainer context={props.context} theme={theme}>
      {props.children}
    </DocsContainer>
  );
}

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
    palette: {
      name: 'Palette',
      defaultValue: 'default',
      toolbar: {
        icon: 'contrast',
        items: [
          { value: 'default', title: 'Default palette' },
          { value: 'split', title: 'Palette stress (grey page, white card)' },
        ],
      },
    },
  },
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    (Story: React.ComponentType, context) => {
      usePaletteStress(context.globals.palette as string);
      return (
        <>
          <Story />
          <ToasterPortal />
        </>
      );
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      container: ThemedDocsContainer,
    },
  },
  tags: ['autodocs'],
};

export default preview;
