import { dasherize, humanize, underscore } from 'inflection';

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

export function humanizeCamel(str: string, lowerFirst?: boolean): string {
  return humanize(underscore(str), lowerFirst);
}
export function dasherizeCamel(str: string): string {
  return dasherize(underscore(lowerCaseFirst(str)));
}
