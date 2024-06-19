import { PluginMetadata } from '@halfdomelabs/project-builder-lib';

export default {
  name: 'storage',
  displayName: 'Storage',
  icon: 'icon.svg',
  description:
    'This plugin allows users to upload and store files in the cloud. S3 is supported by default.',
  version: '0.1.0',
} satisfies PluginMetadata;
