import type React from 'react';

import anser from 'anser';

interface AnsiTextProps {
  text: string;
}

/**
 * Component to render ANSI colored text using anser
 * Uses inline styles only, no CSS classes
 *
 * @param {AnsiTextProps} props - Component props
 * @param {string} props.text - Text with ANSI escape sequences
 * @returns {JSX.Element} Rendered ANSI text with proper styling
 */
export function AnsiText({ text }: AnsiTextProps): React.JSX.Element {
  // Parse ANSI escape sequences
  const parsedLines = text.split('\n').map((line, i) => {
    // Use ansiToJson with use_classes: false to get RGB values
    const parsed = anser.ansiToJson(line, { use_classes: false });

    return (
      <div key={i}>
        {parsed.map((part, j) => {
          // Extract all decorations from the part
          const { decorations } = part;

          // Create the style object
          const style: React.CSSProperties = {};

          // Add foreground color
          if (part.fg) {
            style.color = `rgb(${part.fg})`;
          }

          // Add background color
          if (part.bg) {
            style.backgroundColor = `rgb(${part.bg})`;
          }

          // Add text decorations
          if (decorations.includes('bold')) {
            style.fontWeight = 'bold';
          }

          if (decorations.includes('italic')) {
            style.fontStyle = 'italic';
          }

          if (decorations.includes('dim')) {
            style.opacity = 0.5;
          }

          if (decorations.includes('hidden')) {
            style.visibility = 'hidden';
          }

          // Combine underline and strikethrough if both are present
          const textDecorations = [];
          if (decorations.includes('underline'))
            textDecorations.push('underline');
          if (decorations.includes('strikethrough'))
            textDecorations.push('line-through');
          if (decorations.includes('blink')) textDecorations.push('blink');

          if (textDecorations.length > 0) {
            style.textDecoration = textDecorations.join(' ');
          }

          // Return the styled span
          return (
            <span key={j} style={style}>
              {part.content}
            </span>
          );
        })}
      </div>
    );
  });

  return <>{parsedLines}</>;
}
