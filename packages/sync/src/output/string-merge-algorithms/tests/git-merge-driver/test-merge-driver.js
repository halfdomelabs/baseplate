#!/usr/bin/env node

import fs from 'node:fs';
import { merge } from 'node-diff3';

const args = process.argv.slice(2);

// Basic argument parsing based on expected placeholders %O %A %B
const fileO = args[0]; // Base
const fileA = args[1]; // Current (ours) - Output written here
const fileB = args[2]; // Other (theirs)
// You could parse %L, %P etc. if your mock needs them

if (!fileO || !fileA || !fileB) {
  console.error('Missing required file arguments (%O %A %B)');
  process.exit(129); // Indicate setup failure
}

try {
  const contentO = fs.readFileSync(fileO, 'utf8');
  const contentA = fs.readFileSync(fileA, 'utf8');
  const contentB = fs.readFileSync(fileB, 'utf8');

  // --- Mock Logic ---

  // Case 1: Simulate Conflict based on content
  if (
    contentA.includes('Force Conflict') ||
    contentB.includes('Force Conflict')
  ) {
    const conflictMarker = '=======\n';
    const merged = `<<<<<<< OURS\n${contentA}${conflictMarker}${contentB}>>>>>>> THEIRS\n`;
    fs.writeFileSync(fileA, merged, 'utf8');
    console.log(`Mock driver: Conflict detected.`);
    process.exit(1); // Non-zero exit for conflict
  }

  // Case 2: Simulate Crash based on content
  else if (contentA.includes('Force Crash')) {
    console.error('Mock driver: Simulating crash!');
    process.exit(137); // Exit code > 128 for crash/signal
  }

  // Case 3: Simulate Clean Merge (simple concatenation for test purposes)
  else {
    const mergeResult = merge(contentA, contentO, contentB, {
      ...{
        label: { a: 'existing', b: 'baseplate' },
      },
      stringSeparator: '\n',
    });

    fs.writeFileSync(fileA, mergeResult.result.join('\n'), 'utf8');
    console.log(`Mock driver: Clean merge performed.`);
    process.exit(0); // Zero exit for success
  }
} catch (err) {
  console.error('Mock driver error:', err);
  process.exit(130); // Indicate internal script error
}
