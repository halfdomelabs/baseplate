import { Link as ReactEmailLink } from '@react-email/components';
import * as React from 'react';

import { theme } from '../constants/theme.js';

export interface LinkProps {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const linkStyle: React.CSSProperties = {
  color: theme.colors.primary,
  textDecoration: 'none',
  fontWeight: theme.typography.weights.medium,
};

export function Link({ href, children, style }: LinkProps): React.ReactElement {
  return (
    <ReactEmailLink href={href} style={{ ...linkStyle, ...style }}>
      {children}
    </ReactEmailLink>
  );
}
