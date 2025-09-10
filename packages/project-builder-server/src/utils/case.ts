import { titleize, underscore } from 'inflection';

export function titleizeCamel(str: string): string {
  return titleize(underscore(str));
}
