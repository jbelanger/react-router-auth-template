import { reactRouter } from '@react-router/dev/vite';

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Application build and unit test configuration.
 * See vite.server.config.ts for the server build config (express).
 */
export default defineConfig({
   build: {
      target: 'es2022',
      rollupOptions: {
         // Tells Vite not to bundle these local workspace packages in the SSR build.
         // By leaving them external, Vite won’t transform or ESM-ify their code, which
         // can preserve Node-specific features (like __dirname) and prevent CommonJS
         // incompatibilities. In a pnpm workspace, packages under @gc-fwcs/* may rely on
         // module formats that Vite struggles to bundle. Keeping them external ensures
         // they’re resolved at runtime by Node, avoiding compilation errors in SSR.
         //external: ["@gc-fwcs/logger", "@gc-fwcs/express"],
      },
   },
   optimizeDeps: {
      esbuildOptions: {
         target: 'es2022',
      },
   },
   plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
