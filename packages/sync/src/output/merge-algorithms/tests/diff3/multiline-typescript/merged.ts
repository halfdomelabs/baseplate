export function processData(data: string[]): string {
  return data
    .filter((item) => item.length > 5)
    .map((item) => item.trim())
    .map((item) => item.toUpperCase())
    .join('\n');
}
