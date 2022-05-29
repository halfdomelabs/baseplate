// @ts-nocheck
export {};

// awkward hack for https://stackoverflow.com/questions/66275648/aws-javascript-sdk-v3-typescript-doesnt-compile-due-to-error-ts2304-cannot-f/66275649#66275649

declare global {
  type ReadableStream = unknown;
}
