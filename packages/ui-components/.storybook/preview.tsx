import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import { DARK_MODE_EVENT_NAME } from 'storybook-dark-mode';
import React, { useEffect, useState } from 'react';
import { DocsContainer } from '@storybook/addon-docs';
import { addons } from '@storybook/preview-api';
import { createPortal } from 'react-dom';

import '../src/font.css';
import '../src/styles.css';
import CustomTheme from './CustomTheme';

import { Toaster } from '../src/components/Toaster/Toaster';

let hasToasterRendered = false;

const ToasterPortal = () => {
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
  (Story) => (
    <>
      <Story />
      <ToasterPortal />
    </>
  ),
];

const channel = addons.getChannel();

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
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
      container: (props) => {
        // workaround for https://github.com/hipstersmoothie/storybook-dark-mode/issues/282
        const [isDark, setIsDark] = useState(false);

        useEffect(() => {
          channel.on(DARK_MODE_EVENT_NAME, setIsDark);
          return () => {
            channel.off(DARK_MODE_EVENT_NAME, setIsDark);
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
