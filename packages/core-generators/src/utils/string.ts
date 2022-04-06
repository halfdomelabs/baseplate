export function quot(value: string): string {
  return `'${value.replace("'", "\\'")}'`;
}
