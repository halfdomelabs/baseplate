// merges class names with the storage- prefix
// https://malcolmkee.com/blog/using-tailwindcss-with-module-federation/

export const cn = (...classes: (string | undefined | false)[]): string =>
  classes
    .filter((x): x is string => !!x)
    .map((cls) =>
      cls
        .split(' ')
        .map((className) => `storage-${className}`)
        .join(' '),
    )
    .join(' ');
