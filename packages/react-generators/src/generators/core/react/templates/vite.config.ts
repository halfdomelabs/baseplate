// @ts-nocheck
import { defineConfig, loadEnv } from 'vite';
import dns from 'dns';

// Always ensure we show localhost instead of 127.0.0.1 (fixed in Node 17+)
// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder('verbatim');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envVars = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return CONFIG;
});
