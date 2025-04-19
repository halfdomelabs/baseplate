export function getTextTemplateDelimiters(filename: string): {
  start: string;
  end: string;
} {
  if (filename.endsWith('.css')) {
    return {
      start: '/* ',
      end: ' */',
    };
  }

  return {
    start: '{{',
    end: '}}',
  };
}
