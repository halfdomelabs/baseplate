import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import { useDarkMode } from 'storybook-dark-mode';
import React from 'react';
import { DocsContainer } from '@storybook/addon-docs';

import '../src/font.css';
import '../src/styles.css';
import CustomTheme from './CustomTheme';

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
        const isDark = useDarkMode();
        const currentProps = { ...props };
        currentProps.theme = isDark ? themes.dark : themes.light;
        return React.createElement(DocsContainer, currentProps);
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
