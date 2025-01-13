# Code Morph CLI

`@halfdomelabs/code-morph` is a CLI tool designed to simplify TypeScript code migrations across the Baseplate monorepo by leveraging `ts-morph`. It allows developers to write and execute custom transformations (morphers) on the codebase.

## Features

- **Custom Morphers**: Write and use custom transformation logic for TypeScript files.
- **Interactive CLI**: Select morphers, packages, and configure options interactively.
- **Workspace Awareness**: Automatically detects workspace packages and ensures valid selections.
- **Dry Run Support**: Preview changes without modifying files.
- **Prettier Integration**: Formats transformed files with Prettier.

## Usage

```bash
pnpm run:morpher [options]
```

### Options

- `-d, --dry-run`  
  Run the morpher without making any file changes.

- `-o, --options <options...>`  
  Provide options for the selected morpher in the format `key=value`.

- `-m, --morpher <morpher>`  
  Specify the name of the morpher to run.

- `-p, --packages <packages...>`  
  Specify the workspace packages to run the migration on.

- `--display-command`  
  Display the command to run the selected morpher without executing it.

### Examples

1. **Run a specific morpher interactively**:

   ```bash
   pnpm run:morpher
   ```

2. **Run a specific morpher with options**:

   ```bash
   pnpm run:morpher -m my-morpher -o key1=value1 key2=value2
   ```

3. **Run on specific packages**:

   ```bash
   pnpm run:morpher -m my-morpher -p package-a package-b
   ```

4. **Dry run to preview changes**:

   ```bash
   pnpm run:morpher -m my-morpher -d
   ```

5. **Display the generated command**:
   ```bash
   pnpm run:morpher -m my-morpher --display-command
   ```

## Writing Morphers

A **morpher** defines a custom transformation for TypeScript files. To create a morpher:

1. **Create a file in the `morphers` directory** with a `.morpher.ts` extension.
2. Export a default object implementing the `TypescriptMorpher` interface:

   ```typescript
   export default createTypescriptMorpher({
     name: 'my-morpher',
     description: 'Description of the transformation',
     pathGlobs: ['**/*.ts', '**/*.tsx'],
     options: {
       optionName: {
         description: 'Description of the option',
         optional: true,
         validation: z.string(),
       },
     },
     transform(sourceFile, options) {
       // Transformation logic using ts-morph
     },
   });
   ```

### Testing

Run tests with:

```bash
pnpm test
```

### Writing Tests

Testing custom morphers ensures that your transformations work correctly and consistently across various scenarios. This project includes a helper utility to streamline writing and running morpher tests.

#### Example Test

The following example demonstrates how to write a test for a morpher:

**Test File: `src/morphers/migrate-generator-with-children.morpher.unit.test.ts`**

```typescript
import migrateGeneratorWithChildrenMorpher from './migrate-generator-with-children.morpher.js';
import { runMorpherTests } from './tests/morpher.test-helper.js';

// Run tests for the specified morpher
runMorpherTests(migrateGeneratorWithChildrenMorpher);
```

#### Test Structure

Each test case consists of a directory with the following files:

1. **Input File (`input.ts` or `input.tsx`)**  
   The initial TypeScript file to transform.

2. **Output File (`output.ts` or `output.tsx`)**  
   The expected result after running the transformation.

3. **Options File (`options.json`)** _(optional)_  
   A JSON file defining options to pass to the morpher.

**Directory Structure:**

```plaintext
src/morphers/tests/<morpher-name>/<test-case>/
├── input.ts     # Input file
├── output.ts    # Expected output file
└── options.json # (Optional) Transformation options
```

#### Test Helper: `runMorpherTests`

The `runMorpherTests` function automates running tests for all cases defined in the morpher's test folder. Here's how it works:

1. Collects all test case directories under `src/morphers/tests/<morpher-name>/`.
2. Reads the `input.ts` and `output.ts` files for each test case.
3. Loads the `options.json` file if present.
4. Applies the morpher transformation to the `input.ts` file.
5. Formats the transformed output with Prettier.
6. Compares the result with the `output.ts` file using `Vitest`.

#### Writing a New Test

1. **Create a test case directory:**

   ```plaintext
   src/morphers/tests/<morpher-name>/<test-case>/
   ```

2. **Add an input file (`input.ts`)** that represents the code before transformation.

3. **Add an output file (`output.ts`)** that represents the expected transformed code.

4. _(Optional)_ Add an `options.json` file to specify additional options for the transformation.

5. Ensure the corresponding test file imports the morpher and calls `runMorpherTests`.

#### Running Tests

Use `pnpm` to run all tests:

```bash
pnpm test
```

Run a specific test file:

```bash
pnpm test migrate-generator-with-children
```

#### Example Directory Structure

```plaintext
src/morphers/tests/migrate-generator-with-children/
├── case-1/
│   ├── input.ts
│   ├── output.ts
│   └── options.json
├── case-2/
│   ├── input.tsx
│   ├── output.tsx
│   └── options.json
```
