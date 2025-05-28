import React from 'react';

import type { ComponentStrings } from '#src/constants/strings.js';

import { DEFAULT_COMPONENT_STRINGS } from '#src/constants/strings.js';

const ComponentStringsContext = React.createContext<ComponentStrings>(
  DEFAULT_COMPONENT_STRINGS,
);

export const useComponentStrings = (): ComponentStrings =>
  React.useContext(ComponentStringsContext);

/**
 * @public
 */
export const ComponentStringsProvider = ComponentStringsContext.Provider;
