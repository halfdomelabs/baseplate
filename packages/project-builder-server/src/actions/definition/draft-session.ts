import type {
  EntityServiceContext,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import { ProjectDefinitionContainer } from '@baseplate-dev/project-builder-lib';
import { hashWithSHA256, stringifyPrettyStable } from '@baseplate-dev/utils';
import { fileExists } from '@baseplate-dev/utils/node';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import type { ServiceActionContext } from '#src/actions/types.js';

import { resolveBaseplateDir } from '#src/diff/snapshot/snapshot-utils.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';
import { loadProjectDefinition } from '#src/project-definition/load-project-definition.js';

import { getProjectByNameOrId } from '../utils/projects.js';

const draftSessionMetadataSchema = z.object({
  /** ID of the session that created this draft. */
  sessionId: z.string(),
  /** SHA-256 hash of the original project-definition.json when the draft was created. */
  definitionHash: z.string(),
});

/**
 * Metadata for a draft session, stored separately from the large definition payload.
 */
export type DraftSessionMetadata = z.infer<typeof draftSessionMetadataSchema>;

/**
 * A draft session holds staged entity changes before they are committed
 * to the project-definition.json file.
 */
export interface DraftSession extends DraftSessionMetadata {
  /** The modified serialized definition (with names, not IDs). */
  draftDefinition: Record<string, unknown>;
}

const DRAFT_SESSION_FILENAME = 'draft-session.json';
const DRAFT_DEFINITION_FILENAME = 'draft-definition.json';

function getDraftDir(projectDirectory: string): string {
  const baseplateDir = resolveBaseplateDir(projectDirectory);
  return path.join(baseplateDir, '.build');
}

function getDraftSessionPath(projectDirectory: string): string {
  return path.join(getDraftDir(projectDirectory), DRAFT_SESSION_FILENAME);
}

function getDraftDefinitionPath(projectDirectory: string): string {
  return path.join(getDraftDir(projectDirectory), DRAFT_DEFINITION_FILENAME);
}

export async function loadDraftSession(
  projectDirectory: string,
): Promise<DraftSession | null> {
  const sessionPath = getDraftSessionPath(projectDirectory);
  if (!(await fileExists(sessionPath))) {
    return null;
  }
  const [sessionContents, definitionContents] = await Promise.all([
    readFile(sessionPath, 'utf-8'),
    readFile(getDraftDefinitionPath(projectDirectory), 'utf-8'),
  ]);
  const metadata = draftSessionMetadataSchema.parse(
    JSON.parse(sessionContents),
  );
  const draftDefinition = JSON.parse(definitionContents) as Record<
    string,
    unknown
  >;
  return { ...metadata, draftDefinition };
}

export async function saveDraftSession(
  projectDirectory: string,
  session: DraftSession,
): Promise<void> {
  const draftDir = getDraftDir(projectDirectory);
  await mkdir(draftDir, { recursive: true });
  const metadata: DraftSessionMetadata = {
    sessionId: session.sessionId,
    definitionHash: session.definitionHash,
  };
  await Promise.all([
    writeFile(
      getDraftSessionPath(projectDirectory),
      stringifyPrettyStable(metadata),
    ),
    writeFile(
      getDraftDefinitionPath(projectDirectory),
      stringifyPrettyStable(session.draftDefinition),
    ),
  ]);
}

export async function deleteDraftSession(
  projectDirectory: string,
): Promise<void> {
  const sessionPath = getDraftSessionPath(projectDirectory);
  const definitionPath = getDraftDefinitionPath(projectDirectory);
  await Promise.all([
    fileExists(sessionPath).then((exists) => (exists ? rm(sessionPath) : null)),
    fileExists(definitionPath).then((exists) =>
      exists ? rm(definitionPath) : null,
    ),
  ]);
}

export interface DraftSessionContext {
  session: DraftSession;
  entityContext: EntityServiceContext;
  parserContext: SchemaParserContext;
  projectDirectory: string;
}

/**
 * Gets the existing draft session or creates a new one from the current project definition.
 *
 * If a draft exists but the session ID or definition hash doesn't match, an error is thrown
 * requiring the caller to discard the stale draft first.
 */
export async function getOrCreateDraftSession(
  projectNameOrId: string,
  context: ServiceActionContext,
): Promise<DraftSessionContext> {
  const project = getProjectByNameOrId(context.projects, projectNameOrId);
  const sessionId = context.sessionId ?? 'default';

  const parserContext = await createNodeSchemaParserContext(
    project,
    context.logger,
    context.plugins,
    context.cliVersion,
  );

  const { definition, hash } = await loadProjectDefinition(
    project.directory,
    parserContext,
  );

  const existingDraft = await loadDraftSession(project.directory);

  if (existingDraft) {
    if (existingDraft.sessionId !== sessionId) {
      throw new Error(
        `A draft session exists from a different session (${existingDraft.sessionId}). ` +
          'Discard it with discard-draft before starting a new one.',
      );
    }
    if (existingDraft.definitionHash !== hash) {
      throw new Error(
        'The project definition has changed since the draft was created. ' +
          'Discard the draft with discard-draft and start over.',
      );
    }

    // Rebuild EntityServiceContext from the draft definition
    const draftContainer = ProjectDefinitionContainer.fromSerializedConfig(
      existingDraft.draftDefinition,
      parserContext,
    );
    const entityContext = draftContainer.toEntityServiceContext();

    return {
      session: existingDraft,
      entityContext,
      parserContext,
      projectDirectory: project.directory,
    };
  }

  // Create a new draft from the current definition
  const container = ProjectDefinitionContainer.fromSerializedConfig(
    definition,
    parserContext,
  );
  const entityContext = container.toEntityServiceContext();
  const session: DraftSession = {
    sessionId,
    definitionHash: hash,
    draftDefinition: entityContext.serializedDefinition,
  };

  return {
    session,
    entityContext,
    parserContext,
    projectDirectory: project.directory,
  };
}

/**
 * Loads the definition hash for the given project directory.
 */
export async function loadDefinitionHash(
  projectDirectory: string,
): Promise<string> {
  const baseplateDir = resolveBaseplateDir(projectDirectory);
  const projectJsonPath = path.join(baseplateDir, 'project-definition.json');
  const contents = await readFile(projectJsonPath, 'utf-8');
  return hashWithSHA256(contents);
}
