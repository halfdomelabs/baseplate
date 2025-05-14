import type { ThemeConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { generateCssFromThemeConfig } from '@halfdomelabs/project-builder-lib';
import { TextareaField } from '@halfdomelabs/ui-components';
import { clsx } from 'clsx';
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

interface ThemeColorsCssDisplayProps {
  className?: string;
  control: Control<ThemeConfig>;
}

function convertRecordToCss(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

export function ThemeColorsCssDisplay({
  className,
  control,
}: ThemeColorsCssDisplayProps): React.JSX.Element {
  const colors = useWatch({ control, name: `colors` });

  const cssValue = useMemo(
    () =>
      `
:root {
${convertRecordToCss(generateCssFromThemeConfig(colors.light))}
}

.dark, html[data-theme='dark'] {
${convertRecordToCss(generateCssFromThemeConfig(colors.dark))}
}
    `.trim(),
    [colors],
  );

  return (
    <div className={clsx('', className)}>
      <TextareaField className="h-60" readOnly value={cssValue} />
    </div>
  );
}
