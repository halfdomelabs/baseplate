import { Section as ReactEmailSection } from '@react-email/components';
import * as React from 'react';

type SectionAlign = 'left' | 'center' | 'right';
type SectionSpacing = 'none' | 'sm' | 'md' | 'lg';

export interface SectionProps {
  children: React.ReactNode;
  align?: SectionAlign;
  spacing?: SectionSpacing;
  style?: React.CSSProperties;
}

const spacingValues: Record<SectionSpacing, string> = {
  none: '0',
  sm: '12px 0',
  md: '20px 0',
  lg: '32px 0',
};

export function Section({
  children,
  align = 'left',
  spacing = 'md',
  style,
}: SectionProps): React.ReactElement {
  return (
    <ReactEmailSection
      style={{
        textAlign: align,
        margin: spacingValues[spacing],
        ...style,
      }}
    >
      {children}
    </ReactEmailSection>
  );
}
