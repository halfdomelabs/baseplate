import { dasherize, titleize, underscore } from 'inflection';

function lowerCaseFirst(str: string): string {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function dasherizeCamel(str: string): string {
  return dasherize(underscore(lowerCaseFirst(str)));
}

export function titleizeCamel(str: string): string {
  return titleize(underscore(str));
}
