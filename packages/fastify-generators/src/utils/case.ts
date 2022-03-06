export function lowerCaseFirst(str: string): string {
  if (!str.length) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.substring(1);
}

export function upperCaseFirst(str: string): string {
  if (!str.length) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.substring(1);
}
