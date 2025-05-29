import type { AnserJsonEntry } from 'anser';

import { render, screen } from '@testing-library/react';
import anser from 'anser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnsiText } from './AnsiText.js';

// Mock the anser library
vi.mock('anser', () => ({
  default: {
    ansiToJson: vi.fn(),
  },
}));

// Helper function to create properly typed mock entries
function createMockAnserEntry(
  options: Partial<AnserJsonEntry> = {},
): AnserJsonEntry {
  return {
    content: options.content ?? '',
    fg: options.fg ?? '',
    bg: options.bg ?? '',
    fg_truecolor: options.fg_truecolor ?? '',
    bg_truecolor: options.bg_truecolor ?? '',
    decorations: options.decorations ?? [],
    was_processed: options.was_processed ?? false,
    clearLine: options.clearLine ?? false,
    isEmpty: options.isEmpty ?? (() => false),
    decoration: options.decoration ?? null,
  };
}

// Properly type the mocked function
const mockedAnser = vi.mocked(anser, true);

describe('AnsiText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders plain text without styles', () => {
    const text = 'Hello, world!';

    // Mock ansiToJson to return plain text
    mockedAnser.ansiToJson.mockReturnValueOnce([
      createMockAnserEntry({ content: text }),
    ]);

    render(<AnsiText text={text} />);

    expect(screen.getByText(text)).toBeInTheDocument();
    expect(mockedAnser.ansiToJson).toHaveBeenCalledWith(text, {
      use_classes: false,
    });
  });

  it('applies colors to text', () => {
    const text = 'Colored text';

    // Mock ansiToJson to return text with foreground and background colors
    mockedAnser.ansiToJson.mockReturnValueOnce([
      createMockAnserEntry({
        content: text,
        fg: '255, 0, 0',
        bg: '0, 0, 255',
      }),
    ]);

    render(<AnsiText text={text} />);

    const element = screen.getByText(text);
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle({
      color: 'rgb(255, 0, 0)',
      'background-color': 'rgb(0, 0, 255)',
    });
  });

  it('applies text decorations correctly', () => {
    const text = 'Decorated text';

    // Mock ansiToJson to return text with multiple decorations
    mockedAnser.ansiToJson.mockReturnValueOnce([
      createMockAnserEntry({
        content: text,
        decorations: ['bold', 'italic', 'underline'],
      }),
    ]);

    render(<AnsiText text={text} />);

    const element = screen.getByText(text);
    expect(element).toBeInTheDocument();
    expect(element).toHaveStyle({
      'font-weight': 'bold',
      'font-style': 'italic',
      'text-decoration': 'underline',
    });
  });

  it('handles multiple segments in a line', () => {
    // Mock ansiToJson to return multiple segments with different styles
    mockedAnser.ansiToJson.mockReturnValueOnce([
      createMockAnserEntry({
        content: 'Red',
        fg: '255, 0, 0',
      }),
      createMockAnserEntry({
        content: 'Bold',
        decorations: ['bold'],
        fg: '0, 0, 255',
      }),
    ]);

    render(<AnsiText text="Red Bold" />);

    const redSegment = screen.getByText('Red');
    const boldSegment = screen.getByText('Bold');

    expect(redSegment).toHaveStyle('color: rgb(255, 0, 0)');
    expect(boldSegment).toHaveStyle({
      color: 'rgb(0, 0, 255)',
      'font-weight': 'bold',
    });
  });

  it('renders multiple lines correctly', () => {
    // Set up a mock for multiline text
    const multilineText = 'Line 1\nLine 2';

    // First call for Line 1
    mockedAnser.ansiToJson
      .mockReturnValueOnce([
        createMockAnserEntry({
          content: 'Line 1',
          decorations: ['bold'],
        }),
      ])
      // Second call for Line 2
      .mockReturnValueOnce([
        createMockAnserEntry({
          content: 'Line 2',
          decorations: ['italic'],
        }),
      ]);

    render(<AnsiText text={multilineText} />);

    expect(screen.getByText('Line 1')).toHaveStyle('font-weight: bold');
    expect(screen.getByText('Line 2')).toHaveStyle('font-style: italic');

    // Verify ansiToJson was called once per line
    expect(mockedAnser.ansiToJson).toHaveBeenCalledTimes(2);
  });
});
