export function processData(data: string[]): string {
  return data
    .filter((item) => item.length > 0)
    .map((item) => item.trim())
    .join('\n');
}
