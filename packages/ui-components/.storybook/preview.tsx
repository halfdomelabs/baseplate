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

import { Toaster } from '../src/components/toaster/toaster.js';

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
  },
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    (Story: React.ComponentType) => (
      <>
        <Story />
        <ToasterPortal />
      </>
    ),
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
