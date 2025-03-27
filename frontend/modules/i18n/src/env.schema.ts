// import { z } from 'zod';

// const toBoolean = (val?: string) => val === 'true';

// // Define environment schema
// export const i18nEnvSchema = z.object({
//     I18NEXT_DEBUG: z.string().transform(toBoolean).default('false'),
// });

// // Infer TypeScript type from schema
// export type i18nEnvConfig = z.infer<typeof i18nEnvSchema>;

// // Function to validate environment variables
// export function getEnv(env: NodeJS.ProcessEnv = process.env): i18nEnvConfig {
//     return i18nEnvSchema.parse(env);
// }