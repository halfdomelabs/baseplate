// @ts-nocheck

import { theme } from '$constantsTheme';
import { Hr } from '@react-email/components';
import * as React from 'react';

type DividerSpacing = 'sm' | 'md' | 'lg';

export interface DividerProps {
  spacing?: DividerSpacing;
  style?: React.CSSProperties;
}

const spacingValues: Record<DividerSpacing, string> = {
  sm: '12px 0',
  md: '20px 0',
  lg: '30px 0',
};

export function Divider({
  spacing = 'md',
  style,
}: DividerProps): React.ReactElement {
  return (
    <Hr
      style={{
        borderColor: theme.colors.border,
        margin: spacingValues[spacing],
        ...style,
      }}
    />
  );
}
