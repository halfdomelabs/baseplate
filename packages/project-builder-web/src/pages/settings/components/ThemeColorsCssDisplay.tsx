import {
  ThemeConfig,
  generateCssFromThemeConfig,
} from '@halfdomelabs/project-builder-lib';
import { clsx } from 'clsx';
import { useMemo } from 'react';
import { Control, useWatch } from 'react-hook-form';

import TextAreaInput from 'src/components/TextAreaInput';

interface ThemeColorsCssDisplayProps {
  className?: string;
  control: Control<ThemeConfig>;
}

function convertRecordToCss(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([key, value]) => {
      return `  ${key}: ${value};`;
    })
    .join('\n');
}

export function ThemeColorsCssDisplay({
  className,
  control,
}: ThemeColorsCssDisplayProps): JSX.Element {
  const colors = useWatch({ control, name: `colors` });

  const cssValue = useMemo(() => {
    return `
:root {
${convertRecordToCss(generateCssFromThemeConfig(colors?.light ?? {}))}
}

html[data-theme='dark'] {
${convertRecordToCss(generateCssFromThemeConfig(colors?.dark ?? {}))}
}
    `.trim();
  }, [colors]);

  return (
    <div className={clsx('', className)}>
      <TextAreaInput className="h-60" readOnly value={cssValue} />
    </div>
  );
}
