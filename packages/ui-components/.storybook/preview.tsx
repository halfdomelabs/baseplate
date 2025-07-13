import type { DocsContainerProps } from '@storybook/addon-docs';
import type { Preview } from '@storybook/react-vite';

import { DocsContainer } from '@storybook/addon-docs';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DARK_MODE_EVENT_NAME } from 'storybook-dark-mode';
import { addons } from 'storybook/preview-api';
import { themes } from 'storybook/theming';

import { Toaster } from '../src/components/toaster/toaster.js';
import CustomTheme from './custom-theme.js';
import { isDarkModeEnabled, setDarkModeEnabled } from './dark-mode';

import '../src/styles.css';

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

export const decorators = [
  (Story: React.ElementType) => (
    <>
      <Story />
      <ToasterPortal />
    </>
  ),
];

const channel = addons.getChannel();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    darkMode: {
      dark: { ...themes.dark, ...CustomTheme, brandImage: '/logo_dark.png' },
      light: { ...themes.light, ...CustomTheme, brandImage: '/logo_light.png' },
      current: 'light',
      stylePreview: true,
    },
    docs: {
      container: (props: DocsContainerProps) => {
        // workaround for https://github.com/hipstersmoothie/storybook-dark-mode/issues/282
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [isDark, setIsDark] = useState(isDarkModeEnabled());

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          const handleDarkModeChange = (shouldBeDark: boolean): void => {
            setIsDark(shouldBeDark);
            setDarkModeEnabled(shouldBeDark);
          };
          channel.on(DARK_MODE_EVENT_NAME, handleDarkModeChange);
          return () => {
            channel.off(DARK_MODE_EVENT_NAME, handleDarkModeChange);
          };
        }, []);

        return React.createElement(DocsContainer, {
          ...props,
          theme: isDark ? themes.dark : themes.light,
        });
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
