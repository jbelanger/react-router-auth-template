import { defineConfig } from 'vite';
import { createServerBuildConfig } from '@gc-fwcs/express';

/**
 * Server runtime build configuration for Node.js deployment (Express).
 */
export default defineConfig(createServerBuildConfig({
    build: {
        rollupOptions: {
            // Specifies the entry point for the server runtime.
            // This is the TypeScript file that Vite will start building from.
            input: ['./server.ts'],
            external: ["@gc-fwcs/logger", "@gc-fwcs/express", "@gc-fwcs/helpers"] // To further reduce build size, exclude these modules
        }
    }
}));