import { Text as ReactEmailText } from '@react-email/components';
import * as React from 'react';

import { theme } from '../constants/theme.js';

type TextVariant = 'default' | 'lead' | 'large' | 'small' | 'muted';

export interface TextProps {
  variant?: TextVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantStyles: Record<TextVariant, React.CSSProperties> = {
  default: {
    fontSize: theme.typography.sizes.base,
    lineHeight: theme.typography.lineHeights.normal,
    color: theme.colors.foreground,
    margin: '0 0 16px',
  },
  lead: {
    fontSize: theme.typography.sizes.xl,
    lineHeight: theme.typography.lineHeights.normal,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.mutedForeground,
    margin: '0 0 16px',
  },
  large: {
    fontSize: theme.typography.sizes.lg,
    lineHeight: theme.typography.lineHeights.normal,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.foreground,
    margin: '0 0 16px',
  },
  small: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: theme.typography.lineHeights.none,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.foreground,
    margin: '0 0 12px',
  },
  muted: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: theme.typography.lineHeights.tight,
    color: theme.colors.mutedForeground,
    margin: '0 0 12px',
  },
};

export function Text({
  variant = 'default',
  children,
  style,
}: TextProps): React.ReactElement {
  return (
    <ReactEmailText style={{ ...variantStyles[variant], ...style }}>
      {children}
    </ReactEmailText>
  );
}
