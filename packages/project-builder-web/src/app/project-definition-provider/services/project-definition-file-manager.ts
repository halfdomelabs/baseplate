import { hashWithSHA256 } from '@baseplate-dev/utils';

import {
  downloadProjectDefinition,
  listenForProjectDefinitionChanges,
  uploadProjectDefinition,
} from '#src/services/api/index.js';

export interface ProjectDefinitionFilePayload {
  contents: string;
  hash: string;
  updatedExternally: boolean;
}

export class ProjectDefinitionFileManager {
  public readonly projectId: string;

  protected _definitionFileContentsHash: string | undefined;
  protected _pendingDefinitionFileContentsHash: string | undefined;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  public async downloadDefinitionContents(): Promise<ProjectDefinitionFilePayload> {
    const { contents, hash } = await downloadProjectDefinition(this.projectId);
    // if the contents are different from the current contents and the pending
    // contents, then the definition file was updated externally
    const updatedExternally =
      this._pendingDefinitionFileContentsHash !== hash &&
      this._definitionFileContentsHash !== hash;

    this._definitionFileContentsHash = hash;

    return {
      contents,
      hash,
      updatedExternally,
    };
  }

  public async uploadDefinitionContents(
    newContents: string,
  ): Promise<ProjectDefinitionFilePayload> {
    if (!this._definitionFileContentsHash) {
      throw new Error('Definition file must be downloaded before uploading');
    }

    if (this._pendingDefinitionFileContentsHash) {
      throw new Error(
        `Only one upload can be pending at a time. Please wait for the current upload to complete before uploading again.`,
      );
    }

    try {
      this._pendingDefinitionFileContentsHash =
        await hashWithSHA256(newContents);

      const uploadResult = await uploadProjectDefinition(
        this.projectId,
        newContents,
        this._definitionFileContentsHash,
      );

      if (uploadResult.type === 'original-contents-mismatch') {
        // if the contents are different from the expected contents,
        // overwrite the current contents with the new contents
        this._definitionFileContentsHash = uploadResult.currentPayload.hash;
        return {
          contents: uploadResult.currentPayload.contents,
          hash: uploadResult.currentPayload.hash,
          updatedExternally: true,
        };
      } else {
        // otherwise, keep the new contents
        this._definitionFileContentsHash =
          this._pendingDefinitionFileContentsHash;
        return {
          contents: newContents,
          hash: this._pendingDefinitionFileContentsHash,
          updatedExternally: false,
        };
      }
    } finally {
      this._pendingDefinitionFileContentsHash = undefined;
    }
  }

  public listenForDefinitionFileChanges(
    onDefinitionFileContentsUpdated: (
      payload: ProjectDefinitionFilePayload,
    ) => void,
  ): () => void {
    return listenForProjectDefinitionChanges(this.projectId, (value) => {
      // skip if the contents are the same as the current contents
      if (this._definitionFileContentsHash === value.hash) return;

      this._definitionFileContentsHash = value.hash;
      onDefinitionFileContentsUpdated({
        contents: value.contents,
        hash: value.hash,
        // it was updated externally if it's not from the contents that
        // are pending upload
        updatedExternally:
          this._pendingDefinitionFileContentsHash !== value.hash,
      });
    });
  }
}
