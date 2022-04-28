export function quot(str: string): string {
  if (str.includes("'")) {
    throw new Error(`String cannot contain '`);
  }
  return `'${str}'`;
}

export function doubleQuot(str: string): string {
  if (str.includes('"')) {
    throw new Error(`String cannot contain "`);
  }
  return `"${str}"`;
}
