import { srcSubpathImportPlugin } from '@baseplate-dev/tools/src-subpath-import-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import svgrPlugin from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default {
  plugins: [
    react(),
    svgrPlugin(),
    tailwindcss(),
    srcSubpathImportPlugin(import.meta.dirname),
  ],
};
