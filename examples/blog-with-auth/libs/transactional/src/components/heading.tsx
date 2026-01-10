import { Heading as ReactEmailHeading } from '@react-email/components';
import * as React from 'react';

import { theme } from '../constants/theme.js';

type HeadingLevel = 'h1' | 'h2' | 'h3';

export interface HeadingProps {
  as?: HeadingLevel;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const levelStyles: Record<HeadingLevel, React.CSSProperties> = {
  h1: {
    fontSize: theme.typography.sizes['3xl'],
    lineHeight: theme.typography.lineHeights.none,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: '-0.025em',
    color: theme.colors.foreground,
    margin: '0 0 20px',
  },
  h2: {
    fontSize: theme.typography.sizes['2xl'],
    lineHeight: theme.typography.lineHeights.tight,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: '-0.025em',
    color: theme.colors.foreground,
    margin: '0 0 16px',
  },
  h3: {
    fontSize: theme.typography.sizes.xl,
    lineHeight: theme.typography.lineHeights.normal,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: '-0.025em',
    color: theme.colors.foreground,
    margin: '0 0 12px',
  },
};

export function Heading({
  as = 'h1',
  children,
  style,
}: HeadingProps): React.ReactElement {
  return (
    <ReactEmailHeading as={as} style={{ ...levelStyles[as], ...style }}>
      {children}
    </ReactEmailHeading>
  );
}
