/** @type {import("prettier").Config} */
export default {
  tabWidth: 2,
  singleQuote: true,
  trailingComma: 'es5',
  tailwindFunctions: ['clsx'],
  plugins: [require('prettier-plugin-tailwindcss')],
};
