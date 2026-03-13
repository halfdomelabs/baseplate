import type {
  DefinitionIssue,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import {
  applyDefinitionFixes,
  collectDefinitionIssues,
  fixRefDeletions,
  partitionIssuesBySeverity,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import type { DraftSession } from './draft-session.js';

import { saveDraftSession } from './draft-session.js';

export const definitionIssueSchema = z.object({
  message: z.string().describe('Human-readable description of the issue.'),
  entityId: z
    .string()
    .optional()
    .describe('Entity ID this issue is scoped to, if any.'),
  path: z
    .array(z.union([z.string(), z.number()]))
    .describe(
      'Path relative to the entity (or absolute from root if no entityId).',
    ),
  severity: z
    .enum(['error', 'warning'])
    .describe(
      "Issue severity: 'error' blocks the operation, 'warning' does not.",
    ),
  fixLabel: z
    .string()
    .optional()
    .describe('Label for an available auto-fix, if one exists.'),
  fixId: z
    .string()
    .optional()
    .describe('Deterministic ID for this fix, used with the apply-fix action.'),
});

/**
 * Generates a deterministic fix ID from an issue's identifying properties.
 *
 * STABILITY: This algorithm (djb2) must remain stable — fix IDs are returned
 * to callers and later matched by `apply-fix`. Changing the hash function
 * will silently invalidate all previously-issued fix IDs.
 */
export function generateFixId(issue: DefinitionIssue): string {
  const key = [issue.entityId ?? '', issue.path.join('.'), issue.message].join(
    '|',
  );

  // Simple hash — djb2 algorithm for a short, stable identifier
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 33) ^ (key.codePointAt(i) ?? 0);
  }
  return `fix-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Maps a DefinitionIssue to the output schema shape, including fix metadata.
 */
export function mapIssueToOutput(
  issue: DefinitionIssue,
): z.infer<typeof definitionIssueSchema> {
  return {
    message: issue.message,
    entityId: issue.entityId,
    path: issue.path,
    severity: issue.severity,
    fixLabel: issue.fix?.label,
    fixId: issue.fix ? generateFixId(issue) : undefined,
  };
}

export interface FixAndValidateResult {
  /** The fixed serialized (name-based) definition. */
  fixedSerializedDefinition: Record<string, unknown>;
  /** The container built from the fixed definition. */
  container: ProjectDefinitionContainer;
  /** Errors that block the operation. */
  errors: DefinitionIssue[];
  /** Warnings that don't block the operation. */
  warnings: DefinitionIssue[];
}

/**
 * Applies auto-fixes, fixes dangling references, then validates the definition.
 *
 * Mirrors the web UI save pipeline:
 * 1. applyDefinitionFixes — clears disabled services, etc.
 * 2. fixRefDeletions — cascades reference deletions
 * 3. collectDefinitionIssues — partitions into errors/warnings
 */
export function fixAndValidateDraftDefinition(
  draftDefinition: Record<string, unknown>,
  parserContext: SchemaParserContext,
): FixAndValidateResult {
  const container = ProjectDefinitionContainer.fromSerializedConfig(
    draftDefinition,
    parserContext,
  );

  // Step 1: Apply auto-fixes from registered validators
  const fixedDefinition = applyDefinitionFixes(
    container.schema,
    container.definition,
  );

  // Step 2: Fix dangling references
  const refResult = fixRefDeletions(container.schema, fixedDefinition);

  if (refResult.type === 'failure') {
    // RESTRICT issues — report as errors
    const errors: DefinitionIssue[] = refResult.issues.map((issue) => ({
      message: `Cannot delete: referenced by ${issue.ref.path.join('.')} (onDelete: RESTRICT)`,
      path: issue.ref.path,
      severity: 'error' as const,
    }));

    return {
      fixedSerializedDefinition: draftDefinition,
      container,
      errors,
      warnings: [],
    };
  }

  // Step 3: Build a new container from the fixed refPayload and validate
  const fixedContainer = new ProjectDefinitionContainer(
    refResult.refPayload,
    container.parserContext,
    container.pluginStore,
    container.schema,
  );

  const issues = collectDefinitionIssues(fixedContainer);
  const { errors, warnings } = partitionIssuesBySeverity(issues);

  const fixedSerializedDefinition =
    fixedContainer.toEntityServiceContext().serializedDefinition;

  return {
    fixedSerializedDefinition,
    container: fixedContainer,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Shared CLI output for actions that return { message, issues? }
// ---------------------------------------------------------------------------

/**
 * Writes a success message and any warning issues to the console.
 * Used as the `writeCliOutput` callback for staging actions.
 */
export function writeIssuesCliOutput(output: {
  message: string;
  issues?: { message: string }[];
}): void {
  console.info(`✓ ${output.message}`);
  if (output.issues) {
    for (const issue of output.issues) {
      console.warn(`  ⚠ ${issue.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience: validate + save in one step (used by most staging actions)
// ---------------------------------------------------------------------------

export interface ValidateAndSaveResult {
  /** Warnings that did not block the operation. */
  warnings: DefinitionIssue[];
}

/**
 * Validates a mutated definition, saves it to the draft session, and returns
 * any non-blocking warnings. Throws if validation produces errors.
 *
 * This is the shared "tail" of every staging action:
 *   fixAndValidateDraftDefinition → assert no errors → persist → return warnings
 */
export async function validateAndSaveDraft(
  definition: Record<string, unknown>,
  parserContext: SchemaParserContext,
  session: DraftSession,
  projectDirectory: string,
  errorPrefix = 'Staging blocked by definition errors',
): Promise<ValidateAndSaveResult> {
  const { fixedSerializedDefinition, errors, warnings } =
    fixAndValidateDraftDefinition(definition, parserContext);

  if (errors.length > 0) {
    const messages = errors.map((e) => e.message).join('; ');
    throw new Error(`${errorPrefix}: ${messages}`);
  }

  session.draftDefinition = fixedSerializedDefinition;
  await saveDraftSession(projectDirectory, session);

  return { warnings };
}
