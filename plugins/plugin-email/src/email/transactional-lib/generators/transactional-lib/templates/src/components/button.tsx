// @ts-nocheck

import { theme } from '$constantsTheme';
import { Button as ReactEmailButton } from '@react-email/components';
import * as React from 'react';

type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps {
  variant?: ButtonVariant;
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const baseStyle: React.CSSProperties = {
  borderRadius: '6px',
  fontSize: theme.typography.sizes.sm,
  fontWeight: theme.typography.weights.semibold,
  textDecoration: 'none',
  textAlign: 'center',
  padding: '12px 24px',
  display: 'inline-block',
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    ...baseStyle,
    backgroundColor: theme.colors.primary,
    color: theme.colors.primaryForeground,
  },
  secondary: {
    ...baseStyle,
    backgroundColor: theme.colors.secondary,
    color: theme.colors.secondaryForeground,
  },
};

export function Button({
  variant = 'primary',
  href,
  children,
  style,
}: ButtonProps): React.ReactElement {
  return (
    <ReactEmailButton
      href={href}
      style={{ ...variantStyles[variant], ...style }}
    >
      {children}
    </ReactEmailButton>
  );
}
