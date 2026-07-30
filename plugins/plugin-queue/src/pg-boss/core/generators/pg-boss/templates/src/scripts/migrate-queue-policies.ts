#!/usr/bin/env node
// @ts-nocheck

import type { QueuePolicyFixPlan } from '%queuesImports';

import { createAppRuntime } from '%appRuntimeImports';
import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';

/**
 * One-shot operator script that reviews and, once explicitly confirmed,
 * fixes pg-boss queues whose policy no longer matches what it should be
 * (e.g. a repeatable-job queue created before it required an exclusive
 * policy). `policy` cannot be updated in place, so applying a fix deletes
 * and recreates the affected queue, discarding its pending/active jobs -
 * this never runs implicitly, only when an operator explicitly invokes it
 * with `--yes` after reviewing the plan.
 *
 * Usage:
 *   pnpm script:run src/scripts/migrate-queue-policies.ts --queue <name> [--queue <name> ...] [--yes]
 *   pnpm script:run src/scripts/migrate-queue-policies.ts --all [--yes]
 */

interface CliArgs {
  queueNames: string[] | undefined;
  confirmed: boolean;
}

function parseCliArgs(argv: string[]): CliArgs {
  const { values } = parseArgs({
    args: argv,
    options: {
      queue: { type: 'string', multiple: true },
      all: { type: 'boolean', default: false },
      yes: { type: 'boolean', default: false },
    },
  });

  if (!values.all && (!values.queue || values.queue.length === 0)) {
    logger.info(
      'Usage: migrate-queue-policies.ts --queue <name> [--queue <name> ...] | --all [--yes]',
    );
    process.exit(0);
  }

  return {
    queueNames: values.all ? undefined : values.queue,
    confirmed: values.yes,
  };
}

function printPlan(plans: QueuePolicyFixPlan[]): void {
  for (const plan of plans) {
    logger.info(
      `Queue "${plan.queueName}": policy ${plan.currentState} -> ${plan.desiredState}\n` +
        `  This will delete ${plan.jobsAtRisk.pending} pending job(s) and ${plan.jobsAtRisk.active} active job(s).`,
    );
  }
}

async function confirmInteractively(): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question('Apply this migration? [y/N] ');
    return answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const { queueNames, confirmed: confirmedByFlag } = parseCliArgs(
    process.argv.slice(2),
  );

  const appRuntime = createAppRuntime({ backgroundServices: false });
  try {
    const { queue } = appRuntime.services;
    if (!queue.planQueuePolicyFixes || !queue.applyQueuePolicyFixes) {
      logger.error(
        'This queue backend does not support policy migration (pg-boss only).',
      );
      process.exitCode = 1;
      return;
    }

    const plan = await queue.planQueuePolicyFixes(queueNames);
    if (plan.length === 0) {
      logger.info('No mismatched queues found (or none selected).');
      return;
    }

    printPlan(plan);

    const confirmed = confirmedByFlag || (await confirmInteractively());
    if (!confirmed) {
      logger.info('Dry run only. Re-run with --yes to apply.');
      return;
    }

    const results = await queue.applyQueuePolicyFixes(plan);
    logger.info(
      `Fixed ${results.length} queue(s): ${results
        .map((result) => result.queueName)
        .join(', ')}`,
    );
  } finally {
    await appRuntime.dispose();
  }
}

main().catch((error: unknown) => {
  logError(error, { source: 'migrate-queue-policies' });
  process.exit(1);
});
