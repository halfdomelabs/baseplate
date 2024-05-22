import react from '@vitejs/plugin-react';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default {
  plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
};
