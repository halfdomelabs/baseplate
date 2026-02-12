import { cn } from '@src/utils/cn';

interface CircularProgressProps {
  max?: number;
  value?: number;
  min?: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * A circular progress bar component.
 *
 * https://magicui.design/docs/components/animated-circular-progress-bar
 */
export function CircularProgress({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor = 'var(--primary)',
  gaugeSecondaryColor = 'var(--muted)',
  size = 'md',
  className,
}: CircularProgressProps): React.ReactElement {
  const sizeConfig = {
    xs: {
      containerSize: 'size-8',
      textSize: 'text-xs',
    },
    sm: {
      containerSize: 'size-12',
      textSize: 'text-sm',
    },
    md: {
      containerSize: 'size-20',
      textSize: 'text-lg',
    },
    lg: {
      containerSize: 'size-40',
      textSize: 'text-2xl',
    },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * 45;
  const percentPx = circumference / 100;
  const currentPercent = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div
      className={cn(
        'relative font-semibold',
        config.containerSize,
        config.textSize,
        className,
      )}
      style={
        {
          '--circle-size': '100px',
          '--circumference': circumference,
          '--percent-to-px': `${percentPx}px`,
          '--gap-percent': '5',
          '--offset-factor': '0',
          '--transition-length': '1s',
          '--transition-step': '200ms',
          '--delay': '0s',
          '--percent-to-deg': '3.6deg',
          transform: 'translateZ(0)',
        } as React.CSSProperties
      }
    >
      <svg
        fill="none"
        className={config.containerSize}
        strokeWidth="2"
        viewBox="0 0 100 100"
      >
        {currentPercent <= 90 && currentPercent >= 0 && (
          <circle
            cx="50"
            cy="50"
            r="45"
            strokeWidth="10"
            strokeDashoffset="0"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-100"
            style={
              {
                stroke: gaugeSecondaryColor,
                '--stroke-percent': 90 - currentPercent,
                '--offset-factor-secondary': 'calc(1 - var(--offset-factor))',
                strokeDasharray:
                  'calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)',
                transform:
                  'rotate(calc(1turn - 90deg - (var(--gap-percent) * var(--percent-to-deg) * var(--offset-factor-secondary)))) scaleY(-1)',
                transition: 'all var(--transition-length) ease var(--delay)',
                transformOrigin:
                  'calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)',
              } as React.CSSProperties
            }
          />
        )}
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth="10"
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-100"
          style={
            {
              stroke: gaugePrimaryColor,
              '--stroke-percent': currentPercent,
              strokeDasharray:
                'calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference)',
              transition:
                'var(--transition-length) ease var(--delay),stroke var(--transition-length) ease var(--delay)',
              transitionProperty: 'stroke-dasharray,transform',
              transform:
                'rotate(calc(-90deg + var(--gap-percent) * var(--offset-factor) * var(--percent-to-deg)))',
              transformOrigin:
                'calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)',
            } as React.CSSProperties
          }
        />
      </svg>
      <span
        data-current-value={currentPercent}
        className="absolute inset-0 m-auto size-fit animate-in delay-[var(--delay)] duration-[var(--transition-length)] ease-linear fade-in"
      >
        {currentPercent}
      </span>
    </div>
  );
}
