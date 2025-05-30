import type { RenderOptions, RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import type React from 'react';

import { render } from '@testing-library/react';

import { DEFAULT_COMPONENT_STRINGS } from '#src/constants/strings.js';
import { ComponentStringsProvider } from '#src/contexts/component-strings.js';

const UiComponentProviders = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => (
  <ComponentStringsProvider value={DEFAULT_COMPONENT_STRINGS}>
    {children}
  </ComponentStringsProvider>
);

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult => render(ui, { wrapper: UiComponentProviders, ...options });
