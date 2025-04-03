import path from 'path';
import type { UserConfig, UserConfigExport, ViteDevServer } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const vite = await import('vite');

/**
 * Creates a Vite development server for non-production environments.
 * This function imports the Vite module and creates a new Vite server instance with middleware mode enabled.
 */
export async function createViteDevServer(isProduction: boolean): Promise<ViteDevServer | undefined> {
   if (!isProduction) {
      return await vite.createServer({
         server: { middlewareMode: true },
      });
   }
}

/**
 * Creates a configurable Vite server configuration for building server-side applications.
 * This function provides sensible defaults for server builds while allowing customization.
 *
 * @param customConfig Optional user configuration to override or extend the default settings
 * @returns A merged Vite configuration object
 */
export function createServerBuildConfig(customConfig?: UserConfig): UserConfigExport {
   // Define default server configuration
   const defaultConfig = vite.defineConfig({
      // Tells vite the public dir for serving static files like 500.html and 403.html, used by express.
      // Without it, the express globalErrorHandler middleware will not find them and display a blank page.
      // If overridden, the caller will be responsible to provide the 500 and 403 html files.
      publicDir: path.join(import.meta.dirname, '../', 'public'),

      build: {
         // Prevent Vite from clearing the `outDir` before building. This ensures that other assets
         // (e.g., client-side builds) remain intact in the `./build` directory.
         emptyOutDir: false,

         // Specifies the output directory for the server build.
         outDir: './build/server/',

         // Enables Server-Side Rendering (SSR) mode, optimizing the build process for Node.js.
         ssr: true,

         // Specifies the Node.js version compatibility for the generated output.
         // Setting `target: 'node22'` ensures compatibility with Node.js 22, enabling
         // features like ES modules, top-level await, and modern JavaScript syntax.
         target: 'es2022',

         rollupOptions: {
            // Define which modules should be treated as "external" during server bundling
            // to prevent them from being included in the server build output.
            // Ex: external: ["@gc-fwcs/logger", "@gc-fwcs/express"]
         },
      },
      plugins: [
         // Integrates TypeScript path aliasing using the `vite-tsconfig-paths` plugin,
         // which resolves paths defined in `tsconfig.json` for cleaner imports.
         tsconfigPaths(),
      ],
   });

   // If custom configuration provided, merge it with defaults
   if (customConfig) {
      return vite.mergeConfig(defaultConfig, customConfig);
   }

   return defaultConfig;
}
