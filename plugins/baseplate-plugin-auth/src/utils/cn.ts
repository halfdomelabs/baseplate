export const cn = (...classes: (string | undefined | false)[]): string =>
  classes.filter((x): x is string => !!x).join(' ');
