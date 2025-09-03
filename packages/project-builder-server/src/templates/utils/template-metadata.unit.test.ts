import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  removeTemplateMetadata,
  updateTemplateMetadata,
} from './template-metadata.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('template-metadata', () => {
  beforeEach(() => {
    vol.reset();
  });

  describe('updateTemplateMetadata', () => {
    it('should create new metadata file when none exists', async () => {
      // Arrange
      vol.fromJSON({
        '/project/src/components/': null,
      });

      const filePath = '/project/src/components/Button.tsx';
      const generator = '@baseplate-dev/react-generators#core/react';
      const templateName = 'component';
      const instanceData = { variables: { TPL_COMPONENT_NAME: 'Button' } };

      // Act
      await updateTemplateMetadata(
        filePath,
        generator,
        templateName,
        instanceData,
      );

      // Assert
      const files = vol.toJSON();
      const metadataPath = '/project/src/components/.templates-info.json';

      const fileContent = files[metadataPath];
      const metadata = JSON.parse(fileContent ?? '') as unknown;
      expect(metadata).toEqual({
        'Button.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Button' } },
        },
      });
    });

    it('should update existing metadata file', async () => {
      // Arrange
      const existingMetadata = {
        'Header.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Header' } },
        },
      };

      vol.fromJSON({
        '/project/src/components/.templates-info.json':
          JSON.stringify(existingMetadata),
      });

      const filePath = '/project/src/components/Button.tsx';
      const generator = '@baseplate-dev/react-generators#core/react';
      const templateName = 'component';
      const instanceData = { variables: { TPL_COMPONENT_NAME: 'Button' } };

      // Act
      await updateTemplateMetadata(
        filePath,
        generator,
        templateName,
        instanceData,
      );

      // Assert
      const files = vol.toJSON();
      const metadataPath = '/project/src/components/.templates-info.json';
      const fileContent = files[metadataPath];
      const metadata = JSON.parse(fileContent ?? '') as unknown;
      expect(metadata).toEqual({
        'Header.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Header' } },
        },
        'Button.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Button' } },
        },
      });
    });

    it('should overwrite existing entry for same file', async () => {
      // Arrange
      const existingMetadata = {
        'Button.tsx': {
          template: 'old-component',
          generator: '@baseplate-dev/old-generator',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'OldButton' } },
        },
      };

      vol.fromJSON({
        '/project/src/components/.templates-info.json':
          JSON.stringify(existingMetadata),
      });

      const filePath = '/project/src/components/Button.tsx';
      const generator = '@baseplate-dev/react-generators#core/react';
      const templateName = 'component';
      const instanceData = { variables: { TPL_COMPONENT_NAME: 'Button' } };

      // Act
      await updateTemplateMetadata(
        filePath,
        generator,
        templateName,
        instanceData,
      );

      // Assert
      const files = vol.toJSON();
      const metadataPath = '/project/src/components/.templates-info.json';
      const fileContent = files[metadataPath];
      const metadata = JSON.parse(fileContent ?? '') as unknown;
      expect(metadata).toEqual({
        'Button.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Button' } },
        },
      });
    });

    it('should handle undefined instanceData', async () => {
      // Arrange
      vol.fromJSON({
        '/project/src/components/': null,
      });

      const filePath = '/project/src/components/Button.tsx';
      const generator = '@baseplate-dev/react-generators#core/react';
      const templateName = 'component';

      // Act
      await updateTemplateMetadata(filePath, generator, templateName);

      // Assert
      const files = vol.toJSON();
      const metadataPath = '/project/src/components/.templates-info.json';
      const fileContent = files[metadataPath];
      const metadata = JSON.parse(fileContent ?? '') as unknown;
      expect(metadata).toEqual({
        'Button.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: {},
        },
      });
    });
  });

  describe('removeTemplateMetadata', () => {
    it('should remove file entry from existing metadata', async () => {
      // Arrange
      const existingMetadata = {
        'Button.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Button' } },
        },
        'Header.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Header' } },
        },
      };

      vol.fromJSON({
        '/project/src/components/.templates-info.json':
          JSON.stringify(existingMetadata),
      });

      const filePath = '/project/src/components/Button.tsx';

      // Act
      await removeTemplateMetadata(filePath);

      // Assert
      const files = vol.toJSON();
      const metadataPath = '/project/src/components/.templates-info.json';
      const fileContent = files[metadataPath];
      const metadata = JSON.parse(fileContent ?? '') as unknown;
      expect(metadata).toEqual({
        'Header.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Header' } },
        },
      });
    });

    it('should delete metadata file when no entries remain', async () => {
      // Arrange
      const existingMetadata = {
        'Button.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Button' } },
        },
      };

      vol.fromJSON({
        '/project/src/components/.templates-info.json':
          JSON.stringify(existingMetadata),
      });

      const filePath = '/project/src/components/Button.tsx';

      // Act
      await removeTemplateMetadata(filePath);

      // Assert
      const files = vol.toJSON();
      const metadataPath = '/project/src/components/.templates-info.json';
      expect(files[metadataPath]).toBeUndefined();
    });

    it('should return early when metadata file does not exist', async () => {
      // Arrange
      const filePath = '/project/src/components/Button.tsx';

      // Act
      await removeTemplateMetadata(filePath);

      // Assert
      const files = vol.toJSON();
      const metadataPath = '/project/src/components/.templates-info.json';
      expect(files[metadataPath]).toBeUndefined();
    });

    it('should handle removing non-existent file from metadata', async () => {
      // Arrange
      const existingMetadata = {
        'Header.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Header' } },
        },
      };

      vol.fromJSON({
        '/project/src/components/.templates-info.json':
          JSON.stringify(existingMetadata),
      });

      const filePath = '/project/src/components/Button.tsx';

      // Act
      await removeTemplateMetadata(filePath);

      // Assert
      const files = vol.toJSON();
      const metadataPath = '/project/src/components/.templates-info.json';
      const fileContent = files[metadataPath];
      const metadata = JSON.parse(fileContent ?? '') as unknown;
      expect(metadata).toEqual({
        'Header.tsx': {
          template: 'component',
          generator: '@baseplate-dev/react-generators#core/react',
          instanceData: { variables: { TPL_COMPONENT_NAME: 'Header' } },
        },
      });
    });
  });
});
