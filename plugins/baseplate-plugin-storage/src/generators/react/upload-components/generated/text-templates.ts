import { createTextTemplateFile } from '@halfdomelabs/sync';

const fileInputUploadGql = createTextTemplateFile({
  name: 'file-input-upload-gql',
  source: { path: 'components/FileInput/upload.gql' },
  variables: { TPL_FILE_TYPE: { isIdentifier: true } },
});

export const REACT_UPLOAD_COMPONENTS_TEXT_TEMPLATES = {
  fileInputUploadGql,
};
