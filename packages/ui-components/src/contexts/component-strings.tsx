import React from 'react';

import type { ComponentStrings } from '@src/constants/strings';

import { DEFAULT_COMPONENT_STRINGS } from '@src/constants/strings';

const ComponentStringsContext = React.createContext<ComponentStrings>(
  DEFAULT_COMPONENT_STRINGS,
);

export const useComponentStrings = (): ComponentStrings =>
  React.useContext(ComponentStringsContext);

/**
 * @public
 */
export const ComponentStringsProvider = ComponentStringsContext.Provider;
